import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Phone, ShieldAlert, Navigation, RefreshCw } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withDelay,
} from 'react-native-reanimated';
import { useCurrentLocation } from '@/hooks/use-current-location';
import { LiveRide, riderApi, SOCKET_URL, API_BASE } from '@/lib/api';
import { io, Socket } from 'socket.io-client';

const { height } = Dimensions.get('window');

const MATCH_LABEL: Record<string, string> = {
  Scooty: 'nearby Scooty / Bike partners',
  Bike: 'nearby Bike / Scooty partners',
  Auto: 'nearby Auto partners only',
  Car: 'nearby Car partners only',
};

function haversineKm(
  a: { latitude: number; longitude: number },
  b: { lat: number; lng: number },
) {
  const R = 6371;
  const dLat = ((b.lat - a.latitude) * Math.PI) / 180;
  const dLon = ((b.lng - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export default function TrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    vehicleType?: string;
    vehicleName?: string;
    fare?: string;
    pickup?: string;
    drop?: string;
    pickupLat?: string;
    pickupLng?: string;
  }>();

  const vehicleType = String(params.vehicleType || 'Auto');
  const vehicleName = String(params.vehicleName || vehicleType);
  const drop = String(params.drop || 'Destination');
  const pickup = String(params.pickup || 'Current location');

  const { coords, address, loading: locLoading, error: locError, refresh } = useCurrentLocation({
    watch: true,
    highAccuracy: true,
  });

  const riderId = useMemo(() => `rider-${Date.now().toString(36)}`, []);
  const [ride, setRide] = useState<LiveRide | null>(null);
  const [driverLoc, setDriverLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [lastDriverAt, setLastDriverAt] = useState<string>('');
  const [status, setStatus] = useState<'locating' | 'finding' | 'assigned' | 'error'>('locating');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [routeEtaMin, setRouteEtaMin] = useState<number | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const mapRef = useRef<MapView>(null);
  const rideCreatedRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pulse1 = useSharedValue(1);
  const pulse2 = useSharedValue(1);
  const pulse3 = useSharedValue(1);

  const applyDriverLoc = (lat?: number, lng?: number) => {
    if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    setDriverLoc({ lat: Number(lat), lng: Number(lng) });
    setLastDriverAt(new Date().toLocaleTimeString());
    setStatus('assigned');
  };

  const startSocketAndPoll = (created: LiveRide) => {
    socketRef.current?.disconnect();
    if (pollRef.current) clearInterval(pollRef.current);

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_rider', created.riderId);
      socket.emit('join_ride', created.id);
    });

    socket.on('ride_accepted', (payload: { ride: LiveRide }) => {
      setRide(payload.ride);
      setStatus('assigned');
      applyDriverLoc(
        payload.ride.driverLocation?.lat ?? payload.ride.driverSnapshot?.location?.lat,
        payload.ride.driverLocation?.lng ?? payload.ride.driverSnapshot?.location?.lng,
      );
    });

    socket.on(
      'live_tracking_update',
      (data: { lat: number; lng: number; status?: string; rideId?: string }) => {
        applyDriverLoc(data.lat, data.lng);
        if (data.status) {
          setRide((r) => (r ? { ...r, status: data.status! } : r));
        }
      },
    );

    socket.on('ride_status_updated', (payload: { ride: LiveRide }) => {
      setRide(payload.ride);
      applyDriverLoc(payload.ride.driverLocation?.lat, payload.ride.driverLocation?.lng);
    });

    socket.on('ride_updated', (payload: { ride: LiveRide }) => {
      if (payload?.ride?.id === created.id) {
        setRide(payload.ride);
        if (payload.ride.driverId) setStatus('assigned');
        applyDriverLoc(payload.ride.driverLocation?.lat, payload.ride.driverLocation?.lng);
      }
    });

    // Fast poll — works even if socket fails on mobile network
    pollRef.current = setInterval(async () => {
      try {
        const g = await riderApi.getRide(created.id);
        setRide(g.ride);
        if (g.ride.driverId) {
          setStatus('assigned');
          applyDriverLoc(g.ride.driverLocation?.lat, g.ride.driverLocation?.lng);
        }
        if (g.ride.status === 'Completed') {
          if (pollRef.current) clearInterval(pollRef.current);
          router.replace('/rider/payment');
        }
      } catch {
        /* ignore transient errors */
      }
    }, 2000);
  };

  // 1) Wait for GPS → create ride once
  useEffect(() => {
    if (rideCreatedRef.current || creating) return;

    const lat = coords?.latitude ?? (params.pickupLat ? Number(params.pickupLat) : NaN);
    const lng = coords?.longitude ?? (params.pickupLng ? Number(params.pickupLng) : NaN);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      if (!locLoading) {
        setStatus('error');
        setError(
          locError ||
            'Could not get live GPS. Allow location permission, turn GPS on, then retry.',
        );
      } else {
        setStatus('locating');
      }
      return;
    }

    let cancelled = false;

    (async () => {
      rideCreatedRef.current = true;
      setCreating(true);
      setStatus('finding');
      setError('');
      try {
        const fareNum =
          Number(String(params.fare || '').replace(/[^\d]/g, '')) || undefined;
        const res = await riderApi.createRide({
          riderId,
          riderName: 'Rider',
          pickup: pickup || address || 'Current location',
          drop,
          pickupLat: lat,
          pickupLng: lng,
          vehicleType,
          fare: fareNum,
          distanceKm: 6,
        });
        if (cancelled) return;
        setRide(res.ride);
        startSocketAndPoll(res.ride);
      } catch (e: any) {
        rideCreatedRef.current = false;
        if (!cancelled) {
          setStatus('error');
          setError(
            `${e.message || 'Ride create failed'}\n\nAPI: ${API_BASE}\nIs the backend running?`,
          );
        }
      } finally {
        if (!cancelled) setCreating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords?.latitude, coords?.longitude, locLoading]);

  // Cleanup socket/poll on unmount
  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Push rider GPS while ride active
  useEffect(() => {
    if (!ride?.id || !coords) return;
    const tick = () => {
      riderApi.pushRiderLocation(ride.id, coords.latitude, coords.longitude).catch(() => {});
      socketRef.current?.emit('rider_update_location', {
        rideId: ride.id,
        lat: coords.latitude,
        lng: coords.longitude,
      });
    };
    tick();
    const t = setInterval(tick, 4000);
    return () => clearInterval(t);
  }, [ride?.id, coords?.latitude, coords?.longitude]);

  // Animate map when driver moves + live route from Geoapify
  useEffect(() => {
    if (!driverLoc || !mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: driverLoc.lat,
        longitude: driverLoc.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      500,
    );

    if (!coords) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await riderApi.routing(
          driverLoc.lat,
          driverLoc.lng,
          coords.latitude,
          coords.longitude,
          'drive',
        );
        if (cancelled) return;
        const feature = data.features?.[0];
        const line = feature?.geometry?.coordinates?.[0];
        if (line?.length) {
          // Geoapify returns [lon, lat]
          setRouteCoords(
            line.map((c) => ({
              latitude: c[1],
              longitude: c[0],
            })),
          );
        }
        if (feature?.properties?.time != null) {
          setRouteEtaMin(Math.max(1, Math.ceil(feature.properties.time / 60)));
        }
      } catch {
        /* routing optional if API down */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [driverLoc?.lat, driverLoc?.lng, coords?.latitude, coords?.longitude]);

  useEffect(() => {
    if (status === 'finding' || status === 'locating') {
      pulse1.value = withRepeat(
        withTiming(3, { duration: 2000, easing: Easing.out(Easing.ease) }),
        -1,
        false,
      );
      pulse2.value = withDelay(
        400,
        withRepeat(withTiming(3, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false),
      );
      pulse3.value = withDelay(
        800,
        withRepeat(withTiming(3, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false),
      );
    }
  }, [status]);

  const Ring1 = useAnimatedStyle(() => ({
    transform: [{ scale: pulse1.value }],
    opacity: 1 - pulse1.value / 3,
  }));
  const Ring2 = useAnimatedStyle(() => ({
    transform: [{ scale: pulse2.value }],
    opacity: 1 - pulse2.value / 3,
  }));
  const Ring3 = useAnimatedStyle(() => ({
    transform: [{ scale: pulse3.value }],
    opacity: 1 - pulse3.value / 3,
  }));

  const region: Region | undefined = coords
    ? {
        latitude: driverLoc?.lat ?? coords.latitude,
        longitude: driverLoc?.lng ?? coords.longitude,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      }
    : undefined;

  const etaMin =
    routeEtaMin ??
    (coords && driverLoc
      ? Math.max(1, Math.round((haversineKm(coords, driverLoc) / 22) * 60))
      : null);

  const cancel = async () => {
    if (ride) {
      try {
        await riderApi.cancelRide(ride.id);
      } catch {
        /* ignore */
      }
    }
    router.back();
  };

  const retryAll = () => {
    rideCreatedRef.current = false;
    setRide(null);
    setDriverLoc(null);
    setError('');
    setStatus('locating');
    refresh();
  };

  // Locating / finding UI
  if (status === 'locating' || status === 'finding') {
    return (
      <View style={styles.findingContainer}>
        <View style={styles.radarCenter}>
          <Animated.View style={[styles.pulseRing, Ring3]} />
          <Animated.View style={[styles.pulseRing, Ring2]} />
          <Animated.View style={[styles.pulseRing, Ring1]} />
          <View style={styles.centerPinIcon}>
            <View style={styles.pinDot} />
          </View>
        </View>
        <View style={styles.statusTextContainer}>
          <Text style={styles.findingTitle}>
            {status === 'locating' || locLoading
              ? 'Getting your live location…'
              : ride
                ? `Finding a ${vehicleName} driver…`
                : `Creating your ride…`}
          </Text>
          <Text style={styles.findingSubtitle}>
            {MATCH_LABEL[vehicleType] || 'Matching partners'}
          </Text>
          {coords ? (
            <Text style={styles.gpsLine}>
              Your GPS: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
            </Text>
          ) : null}
          {ride ? (
            <Text style={styles.gpsLine}>
              Ride ID: {ride.id.slice(0, 10)}… — waiting for driver to accept
            </Text>
          ) : null}
          <Text style={styles.apiHint}>{API_BASE}</Text>
        </View>
        <TouchableOpacity style={styles.cancelLink} onPress={cancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.findingContainer}>
        <Text style={styles.findingTitle}>Location / tracking issue</Text>
        <Text style={styles.findingSubtitle}>{error}</Text>
        <TouchableOpacity style={styles.retry} onPress={retryAll}>
          <RefreshCw color={Colors.primary} size={16} />
          <Text style={styles.retryText}>Retry GPS & ride</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelLink} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Assigned — live map
  const d = ride?.driverSnapshot;

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        {region ? (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={region}
            showsUserLocation
            showsMyLocationButton={false}
            loadingEnabled
          >
            {coords ? (
              <Marker
                coordinate={{ latitude: coords.latitude, longitude: coords.longitude }}
                title="You (rider)"
                description={address}
                pinColor="#C9A25D"
              >
                <View style={styles.youPin}>
                  <View style={styles.youDot} />
                </View>
              </Marker>
            ) : null}
            {driverLoc ? (
              <Marker
                coordinate={{ latitude: driverLoc.lat, longitude: driverLoc.lng }}
                title={d?.name || 'Driver'}
                description="Live location"
              >
                <View style={styles.driverPin}>
                  <Navigation color={Colors.white} size={14} />
                </View>
              </Marker>
            ) : null}
            {routeCoords.length > 1 ? (
              <Polyline
                coordinates={routeCoords}
                strokeColor={Colors.primary}
                strokeWidth={4}
              />
            ) : null}
          </MapView>
        ) : (
          <View style={styles.mapFallback}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={{ marginTop: 8, color: Colors.text }}>Map loading…</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.sosButton}
        onPress={() => Alert.alert('SOS', 'Emergency: +91 80000 00000')}
      >
        <ShieldAlert color={Colors.error} size={24} />
      </TouchableOpacity>

      <View style={styles.sheet}>
        <View style={styles.dragHandle} />

        <View style={styles.etaHeader}>
          <Text style={styles.etaTitle}>
            {driverLoc ? 'Driver live on map' : 'Waiting for driver GPS…'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={styles.etaNumber}>{etaMin ?? '—'}</Text>
            <Text style={styles.etaMin}> min</Text>
          </View>
        </View>

        {driverLoc ? (
          <Text style={styles.liveLine}>
            ● LIVE {driverLoc.lat.toFixed(5)}, {driverLoc.lng.toFixed(5)}
            {lastDriverAt ? ` · ${lastDriverAt}` : ''}
          </Text>
        ) : (
          <Text style={styles.waitLine}>
            After the driver accepts, their live location will move here
          </Text>
        )}

        {coords ? (
          <Text style={styles.youLine}>
            You: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
          </Text>
        ) : null}

        <View style={styles.driverSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(d?.name || 'D')
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.driverName}>{d?.name || 'Partner'}</Text>
            <Text style={styles.vehicleInfo}>
              {d?.vehicle?.type || vehicleName} · {d?.vehicle?.registrationNumber || '—'}
            </Text>
            <Text style={styles.vehicleInfo}>Status: {ride?.status || '—'}</Text>
          </View>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={() => d?.phone && Alert.alert('Call driver', String(d.phone))}
          >
            <Phone color={Colors.primary} size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.routeBox}>
          <Text style={styles.routeText} numberOfLines={1}>
            From: {ride?.pickup || pickup}
          </Text>
          <Text style={[styles.routeText, { fontWeight: '700' }]} numberOfLines={1}>
            To: {ride?.drop || drop}
          </Text>
          <Text style={styles.fare}>Fare ₹{ride?.fare ?? '—'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  findingContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  radarCenter: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  centerPinIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.white },
  statusTextContainer: { marginTop: 36, alignItems: 'center', gap: 8 },
  findingTitle: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  findingSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  gpsLine: { color: Colors.accent, fontSize: 12, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  apiHint: { color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 12 },
  cancelLink: { marginTop: 28, padding: 12 },
  cancelText: { color: 'rgba(255,255,255,0.85)', fontWeight: '700' },
  retry: {
    marginTop: 16,
    backgroundColor: Colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryText: { color: Colors.primary, fontWeight: '800' },
  mapContainer: { height: height * 0.52, width: '100%' },
  map: { flex: 1 },
  mapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8EEF6',
  },
  youPin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(201,162,93,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  youDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.accent,
    borderWidth: 2,
    borderColor: '#fff',
  },
  driverPin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  sosButton: {
    position: 'absolute',
    top: 54,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  sheet: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    padding: 20,
  },
  dragHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E8EB',
    marginBottom: 14,
  },
  etaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  etaTitle: { fontSize: 14, fontWeight: '700', color: Colors.textLight, flex: 1 },
  etaNumber: { fontSize: 36, fontWeight: '800', color: Colors.primary },
  etaMin: { fontSize: 16, fontWeight: '600', color: Colors.textLight },
  liveLine: { marginTop: 8, fontSize: 12, fontWeight: '800', color: Colors.success },
  waitLine: { marginTop: 8, fontSize: 12, fontWeight: '600', color: Colors.textLight },
  youLine: { marginTop: 4, fontSize: 11, fontWeight: '600', color: Colors.textLight },
  driverSection: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.white, fontWeight: '800' },
  driverName: { fontSize: 17, fontWeight: '700', color: Colors.text },
  vehicleInfo: { fontSize: 12, color: Colors.textLight, marginTop: 2, fontWeight: '600' },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeBox: {
    marginTop: 16,
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  routeText: { fontSize: 13, color: Colors.text },
  fare: { marginTop: 6, fontSize: 16, fontWeight: '800', color: Colors.primary },
});
