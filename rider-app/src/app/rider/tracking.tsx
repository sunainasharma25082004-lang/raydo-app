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
  StatusBar,
} from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Shadow } from '@/constants/Colors';
import {
  Phone,
  ShieldAlert,
  Navigation,
  RefreshCw,
  X,
  MapPin,
  Clock,
  Sparkles,
  Radio,
} from 'lucide-react-native';
import MapViewDirections from 'react-native-maps-directions';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withDelay,
  withSequence,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useCurrentLocation } from '@/hooks/use-current-location';
import { LiveRide, riderApi, SOCKET_URL, API_BASE } from '@/lib/api';
import { io, Socket } from 'socket.io-client';

const { height } = Dimensions.get('window');

const MATCH_LABEL: Record<string, string> = {
  Scooty: 'Notifying Scooty & Bike partners nearby',
  Bike: 'Notifying Bike & Scooty partners nearby',
  Auto: 'Notifying Auto partners near you',
  Car: 'Notifying Car partners near you',
};

const VEHICLE_EMOJI: Record<string, string> = {
  Scooty: '🛵',
  Bike: '🏍',
  Auto: '🛺',
  Car: '🚗',
};

const FINDING_MESSAGES = [
  'Looking for nearby drivers…',
  'Sending your request…',
  'Waiting for a driver to accept…',
  'Almost there — hang tight…',
];

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

function formatElapsed(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TrackingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
  const fareLabel = String(params.fare || '—');
  const vehicleEmoji = VEHICLE_EMOJI[vehicleType] || '🚗';

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
  const [routeEtaMin, setRouteEtaMin] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const mapRef = useRef<MapView>(null);
  const rideCreatedRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pulse1 = useSharedValue(0);
  const pulse2 = useSharedValue(0);
  const pulse3 = useSharedValue(0);
  const floatY = useSharedValue(0);
  const spin = useSharedValue(0);

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
            `${e.message || 'Ride create failed'}\n\nIs the backend running?\n${API_BASE}`,
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

  // Animate map when driver moves + live route
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
        if (feature?.properties?.time != null) {
          setRouteEtaMin(Math.max(1, Math.ceil(feature.properties.time / 60)));
        }
      } catch {
        /* routing optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [driverLoc?.lat, driverLoc?.lng, coords?.latitude, coords?.longitude]);

  // Waiting animations + timer + rotating copy
  useEffect(() => {
    if (status !== 'finding' && status !== 'locating') return;

    pulse1.value = 0;
    pulse2.value = 0;
    pulse3.value = 0;
    pulse1.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
    pulse2.value = withDelay(
      450,
      withRepeat(withTiming(1, { duration: 2200, easing: Easing.out(Easing.ease) }), -1, false),
    );
    pulse3.value = withDelay(
      900,
      withRepeat(withTiming(1, { duration: 2200, easing: Easing.out(Easing.ease) }), -1, false),
    );
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    spin.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.linear }),
      -1,
      false,
    );

    setElapsed(0);
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    const msgTimer = setInterval(
      () => setMsgIndex((i) => (i + 1) % FINDING_MESSAGES.length),
      2800,
    );
    return () => {
      clearInterval(timer);
      clearInterval(msgTimer);
    };
  }, [status]);

  const Ring1 = useAnimatedStyle(() => {
    const s = interpolate(pulse1.value, [0, 1], [1, 2.6], Extrapolation.CLAMP);
    const o = interpolate(pulse1.value, [0, 1], [0.55, 0], Extrapolation.CLAMP);
    return { transform: [{ scale: s }], opacity: o };
  });
  const Ring2 = useAnimatedStyle(() => {
    const s = interpolate(pulse2.value, [0, 1], [1, 2.6], Extrapolation.CLAMP);
    const o = interpolate(pulse2.value, [0, 1], [0.45, 0], Extrapolation.CLAMP);
    return { transform: [{ scale: s }], opacity: o };
  });
  const Ring3 = useAnimatedStyle(() => {
    const s = interpolate(pulse3.value, [0, 1], [1, 2.6], Extrapolation.CLAMP);
    const o = interpolate(pulse3.value, [0, 1], [0.35, 0], Extrapolation.CLAMP);
    return { transform: [{ scale: s }], opacity: o };
  });
  const FloatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));
  const OrbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
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

  const stepIndex =
    status === 'locating' ? 0 : !ride ? 1 : 2;

  // ── Locating / finding ──────────────────────────────────────────────
  if (status === 'locating' || status === 'finding') {
    const title =
      status === 'locating' || locLoading
        ? 'Pinning your location…'
        : ride
          ? FINDING_MESSAGES[msgIndex]
          : 'Creating your ride request…';

    const subtitle =
      status === 'locating' || locLoading
        ? 'We need GPS once so drivers can find you accurately'
        : MATCH_LABEL[vehicleType] || 'Matching partners near you';

    return (
      <View style={styles.waitRoot}>
        <StatusBar barStyle="light-content" />

        {/* Decorative top */}
        <View style={[styles.waitHero, { paddingTop: Math.max(insets.top, 12) + 4 }]}>
          <View style={styles.heroBlobA} />
          <View style={styles.heroBlobB} />

          <View style={styles.waitTopBar}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={cancel}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X color={Colors.white} size={20} strokeWidth={2.5} />
            </TouchableOpacity>
            <View style={styles.timerPill}>
              <Clock size={13} color={Colors.accent} />
              <Text style={styles.timerText}>{formatElapsed(elapsed)}</Text>
            </View>
          </View>

          <View style={styles.radarWrap}>
            <Animated.View style={[styles.pulseRing, Ring3]} />
            <Animated.View style={[styles.pulseRing, Ring2]} />
            <Animated.View style={[styles.pulseRing, Ring1]} />

            <Animated.View style={[styles.orbitRing, OrbitStyle]}>
              <View style={styles.orbitDot} />
              <View style={[styles.orbitDot, styles.orbitDot2]} />
            </Animated.View>

            <Animated.View style={[styles.vehicleBubble, FloatStyle]}>
              <Text style={styles.vehicleEmoji}>{vehicleEmoji}</Text>
            </Animated.View>
          </View>

          <View style={styles.heroCopy}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>
                {ride ? 'Request live' : status === 'locating' ? 'Locating' : 'Sending'}
              </Text>
            </View>
            <Text style={styles.waitTitle}>{title}</Text>
            <Text style={styles.waitSubtitle}>{subtitle}</Text>
          </View>
        </View>

        {/* Bottom sheet */}
        <View style={[styles.waitSheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={styles.dragHandle} />

          {/* Progress steps */}
          <View style={styles.stepsRow}>
            {[
              { key: 'gps', label: 'Location' },
              { key: 'req', label: 'Request' },
              { key: 'accept', label: 'Accept' },
            ].map((s, i) => {
              const done = i < stepIndex;
              const active = i === stepIndex;
              return (
                <React.Fragment key={s.key}>
                  {i > 0 ? (
                    <View style={[styles.stepLine, (done || active) && styles.stepLineOn]} />
                  ) : null}
                  <View style={styles.stepItem}>
                    <View
                      style={[
                        styles.stepDot,
                        done && styles.stepDotDone,
                        active && styles.stepDotActive,
                      ]}
                    >
                      {done ? (
                        <Text style={styles.stepCheck}>✓</Text>
                      ) : (
                        <Text style={[styles.stepNum, active && styles.stepNumActive]}>
                          {i + 1}
                        </Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.stepLabel,
                        (done || active) && styles.stepLabelOn,
                      ]}
                    >
                      {s.label}
                    </Text>
                  </View>
                </React.Fragment>
              );
            })}
          </View>

          {/* Trip summary card */}
          <View style={styles.tripCard}>
            <View style={styles.tripRoute}>
              <View style={styles.routeDotsCol}>
                <View style={styles.dotPick} />
                <View style={styles.routeDash} />
                <MapPin size={12} color={Colors.accent} />
              </View>
              <View style={styles.routeTexts}>
                <View>
                  <Text style={styles.routeLabel}>PICKUP</Text>
                  <Text style={styles.routeValue} numberOfLines={1}>
                    {pickup || address || 'Current location'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.routeLabel}>DROP</Text>
                  <Text style={[styles.routeValue, styles.routeDrop]} numberOfLines={1}>
                    {drop}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.tripMeta}>
              <View style={styles.metaChip}>
                <Text style={styles.metaEmoji}>{vehicleEmoji}</Text>
                <Text style={styles.metaChipText}>{vehicleName}</Text>
              </View>
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>{fareLabel}</Text>
              </View>
              {ride ? (
                <View style={[styles.metaChip, styles.metaChipSoft]}>
                  <Radio size={12} color={Colors.success} />
                  <Text style={[styles.metaChipText, { color: Colors.success }]}>On air</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.hintRow}>
            <Sparkles size={14} color={Colors.accentDark} />
            <Text style={styles.hintText}>
              Drivers nearby will see your request. You can cancel anytime before accept.
            </Text>
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={cancel} activeOpacity={0.88}>
            <Text style={styles.cancelBtnText}>Cancel request</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <View style={[styles.waitRoot, styles.errorRoot]}>
        <StatusBar barStyle="dark-content" />
        <View style={[styles.errorCard, { marginTop: insets.top + 40 }]}>
          <View style={styles.errorIcon}>
            <RefreshCw color={Colors.error} size={28} />
          </View>
          <Text style={styles.errorTitle}>Couldn’t start your ride</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={retryAll} activeOpacity={0.9}>
            <RefreshCw color={Colors.white} size={16} />
            <Text style={styles.retryBtnText}>Try again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.errorBack} onPress={() => router.back()}>
            <Text style={styles.errorBackText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Assigned — live map ─────────────────────────────────────────────
  const d = ride?.driverSnapshot;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
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
            {driverLoc && coords ? (
              <MapViewDirections
                origin={{ latitude: driverLoc.lat, longitude: driverLoc.lng }}
                destination={{ latitude: coords.latitude, longitude: coords.longitude }}
                apikey="AIzaSyCM7PNM7qrecVBF7VGERs6SLS73kLLZfX8"
                strokeWidth={4}
                strokeColor={Colors.primary}
                onReady={(result) => setRouteEtaMin(Math.ceil(result.duration))}
                onError={(e) => console.log('Directions Error:', e)}
                resetOnChange={false}
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
        style={[styles.sosButton, { top: Math.max(insets.top, 12) + 8 }]}
        onPress={() => Alert.alert('SOS', 'Emergency: +91 80000 00000')}
      >
        <ShieldAlert color={Colors.error} size={24} />
      </TouchableOpacity>

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
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
            ● LIVE{lastDriverAt ? ` · updated ${lastDriverAt}` : ''}
          </Text>
        ) : (
          <Text style={styles.waitLine}>
            After the driver accepts, their live location will move here
          </Text>
        )}

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
          <Text style={styles.routeBoxText} numberOfLines={1}>
            From: {ride?.pickup || pickup}
          </Text>
          <Text style={[styles.routeBoxText, { fontWeight: '700' }]} numberOfLines={1}>
            To: {ride?.drop || drop}
          </Text>
          <Text style={styles.fare}>Fare ₹{(ride?.fare ?? fareLabel.replace(/[^\d]/g, '')) || '—'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  /* ── Waiting screen ── */
  waitRoot: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  waitHero: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 28,
    minHeight: height * 0.48,
    overflow: 'hidden',
  },
  heroBlobA: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(201,162,93,0.12)',
    top: -40,
    right: -60,
  },
  heroBlobB: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: 20,
    left: -40,
  },
  waitTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  timerText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  radarWrap: {
    alignSelf: 'center',
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  pulseRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  orbitRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
    borderColor: 'rgba(201,162,93,0.35)',
    borderStyle: Platform.OS === 'ios' ? 'dashed' : 'solid',
  },
  orbitDot: {
    position: 'absolute',
    top: -5,
    left: '50%',
    marginLeft: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
  },
  orbitDot2: {
    top: undefined,
    bottom: -4,
    left: undefined,
    right: 18,
    marginLeft: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  vehicleBubble: {
    width: 78,
    height: 78,
    borderRadius: 28,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.card,
  },
  vehicleEmoji: { fontSize: 36 },
  heroCopy: { alignItems: 'center', paddingHorizontal: 8 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    marginBottom: 12,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#5CDB95',
  },
  liveBadgeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  waitTitle: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  waitSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    fontWeight: '500',
    paddingHorizontal: 12,
  },

  waitSheet: {
    flex: 1,
    marginTop: -18,
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  dragHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderStrong,
    marginBottom: 18,
  },

  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  stepItem: { alignItems: 'center', width: 72 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepDotDone: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  stepNum: { fontSize: 12, fontWeight: '800', color: Colors.textLight },
  stepNumActive: { color: Colors.white },
  stepCheck: { color: Colors.white, fontSize: 13, fontWeight: '800' },
  stepLabel: { fontSize: 11, fontWeight: '700', color: Colors.textLight },
  stepLabelOn: { color: Colors.text },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginBottom: 18,
    maxWidth: 40,
  },
  stepLineOn: { backgroundColor: Colors.primaryMuted },

  tripCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.soft,
    marginBottom: 14,
  },
  tripRoute: { flexDirection: 'row', gap: 12 },
  routeDotsCol: { alignItems: 'center', width: 14, paddingTop: 4 },
  dotPick: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  routeDash: {
    width: 2,
    flex: 1,
    minHeight: 18,
    backgroundColor: Colors.borderStrong,
    marginVertical: 4,
  },
  routeTexts: { flex: 1, gap: 12 },
  routeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textLight,
    letterSpacing: 0.6,
  },
  routeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  routeDrop: { color: Colors.text, fontWeight: '800' },
  tripMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  metaChipSoft: { backgroundColor: Colors.successSoft },
  metaEmoji: { fontSize: 13 },
  metaChipText: { fontSize: 12, fontWeight: '800', color: Colors.text },

  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.accentSoft,
    borderRadius: Radius.lg,
    padding: 12,
    marginBottom: 14,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: Colors.borderStrong,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textSecondary,
  },

  /* ── Error ── */
  errorRoot: {
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
  },
  errorCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: Colors.errorSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorBody: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    width: '100%',
    justifyContent: 'center',
  },
  retryBtnText: { color: Colors.white, fontWeight: '800', fontSize: 15 },
  errorBack: { marginTop: 14, padding: 10 },
  errorBackText: { color: Colors.textLight, fontWeight: '700', fontSize: 14 },

  /* ── Assigned map ── */
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
  etaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  etaTitle: { fontSize: 14, fontWeight: '700', color: Colors.textLight, flex: 1 },
  etaNumber: { fontSize: 36, fontWeight: '800', color: Colors.primary },
  etaMin: { fontSize: 16, fontWeight: '600', color: Colors.textLight },
  liveLine: { marginTop: 8, fontSize: 12, fontWeight: '800', color: Colors.success },
  waitLine: { marginTop: 8, fontSize: 12, fontWeight: '600', color: Colors.textLight },
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
  routeBoxText: { fontSize: 13, color: Colors.text },
  fare: { marginTop: 6, fontSize: 16, fontWeight: '800', color: Colors.primary },
});
