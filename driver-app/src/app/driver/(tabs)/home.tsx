import React, { useEffect, useRef } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Sparkles, Star, Zap } from 'lucide-react-native';
import { io, Socket } from 'socket.io-client';
import { Screen } from '@/components/ui/Screen';
import { MapCanvas } from '@/components/ui/MapCanvas';
import { OnlineToggle } from '@/components/driver/OnlineToggle';
import { StatPill } from '@/components/driver/StatPill';
import { Button } from '@/components/ui/Button';
import { useDriver } from '@/context/DriverContext';
import { formatInr, vehiclesMatch } from '@/data/mock';
import { Colors, Radius, Shadow } from '@/constants/Colors';
import { useCurrentLocation } from '@/hooks/use-current-location';
import { useLiveLocationSync } from '@/hooks/use-live-location-sync';
import { useSession } from '@/context/SessionContext';
import { api, LiveRide, SOCKET_URL } from '@/lib/api';
import {
  notifyRideRequest,
  setupDriverNotifications,
} from '@/lib/notifications';

function pickMatchingRide(rides: LiveRide[] | undefined, driverVehicle?: string | null) {
  if (!rides?.length) return null;
  const matched = rides.filter((r) =>
    driverVehicle ? vehiclesMatch(driverVehicle, r.vehicleType) : true,
  );
  // Prefer nearest if distance available
  matched.sort((a, b) => {
    const da = a.distanceKmFromDriver ?? 999;
    const db = b.distanceKmFromDriver ?? 999;
    return da - db;
  });
  return matched[0] || null;
}

export default function DriverHomeScreen() {
  const router = useRouter();
  const {
    driver,
    isOnline,
    setOnline,
    tripStatus,
    todayEarnings,
    todayTrips,
    simulateIncoming,
    presentIncomingRide,
  } = useDriver();
  const { token, driver: sessionDriver } = useSession();
  const myVehicle = sessionDriver?.vehicle?.type || driver.vehicleCategory;
  const { coords, address, loading: locLoading, error: locError, refresh: refreshLocation } =
    useCurrentLocation({ watch: true, highAccuracy: true });
  const lastNavStatus = useRef<string | null>(null);
  const shownIds = useRef<Set<string>>(new Set());
  const socketRef = useRef<Socket | null>(null);

  // Real GPS → backend + rider sockets while online
  useLiveLocationSync({ enabled: isOnline, isOnline });

  // Notification permission once
  useEffect(() => {
    setupDriverNotifications();
  }, []);

  useEffect(() => {
    if (lastNavStatus.current === tripStatus) return;

    if (tripStatus === 'incoming') {
      lastNavStatus.current = tripStatus;
      router.push('/driver/request');
    } else if (tripStatus === 'to_pickup' || tripStatus === 'waiting' || tripStatus === 'in_trip') {
      lastNavStatus.current = tripStatus;
      router.push('/driver/trip');
    } else if (tripStatus === 'completed') {
      lastNavStatus.current = tripStatus;
      router.push('/driver/complete');
    } else if (tripStatus === 'idle') {
      lastNavStatus.current = 'idle';
    }
  }, [tripStatus, router]);

  const offerRide = (r: LiveRide) => {
    if (!r?.id || shownIds.current.has(r.id)) return;
    if (tripStatus !== 'idle' || !isOnline) return;

    const shown = presentIncomingRide({
      id: r.id,
      riderName: r.riderName,
      pickup: r.pickup,
      drop: r.drop,
      fare: r.fare,
      distanceKm: r.distanceKm,
      vehicleType: r.vehicleType,
      distanceKmFromDriver: r.distanceKmFromDriver,
      riderPhone: r.riderPhone,
    });
    if (!shown) return;

    shownIds.current.add(r.id);
    notifyRideRequest({
      riderName: r.riderName || 'Rider',
      fare: r.fare || 0,
      pickup: r.pickup || 'Pickup',
      vehicle: r.vehicleType,
      distanceKm: r.distanceKmFromDriver,
      rideId: r.id,
    });
  };

  // Poll server for open rides while online
  useEffect(() => {
    if (!isOnline || !token || tripStatus !== 'idle') return;
    let cancelled = false;

    const check = async () => {
      try {
        const res = await api.openRides(token);
        if (cancelled) return;
        const r = pickMatchingRide(res.rides, myVehicle);
        if (r) offerRide(r);
      } catch {
        /* backend offline */
      }
    };

    check();
    const t = setInterval(check, 5000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, token, tripStatus, myVehicle]);

  // Instant socket requests
  useEffect(() => {
    if (!isOnline || !token || !sessionDriver?.id) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_driver', {
        driverId: sessionDriver.id,
        vehicleType: sessionDriver.vehicle?.type || myVehicle,
      });
      if (sessionDriver.vehicle?.type || myVehicle) {
        socket.emit('join_vehicle_group', sessionDriver.vehicle?.type || myVehicle);
      }
    });

    socket.on('new_ride_request', (payload: { ride?: LiveRide; distanceKm?: number }) => {
      const ride = payload?.ride;
      if (!ride?.id) return;
      if (!vehiclesMatch(myVehicle, ride.vehicleType)) return;
      offerRide({
        ...ride,
        distanceKmFromDriver:
          payload.distanceKm ?? ride.distanceKmFromDriver ?? null,
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, token, sessionDriver?.id, myVehicle]);

  const busy = tripStatus !== 'idle' && tripStatus !== 'incoming';

  const goOnline = async (value: boolean) => {
    setOnline(value);
    if (token) {
      try {
        await api.setOnline(token, value, coords?.latitude, coords?.longitude);
        if (value) {
          setupDriverNotifications();
        }
      } catch (e: any) {
        if (value) {
          Alert.alert(
            'Online',
            e.message || 'Could not connect to backend. Check API IP in config.ts.',
          );
        }
      }
    } else if (value) {
      Alert.alert(
        'Login required',
        'Sign in with your admin-approved Driver ID for live tracking.',
      );
    }
  };

  const fetchOpenRides = async () => {
    if (!token) {
      Alert.alert('Login required', 'Sign in with driver credentials for real rides.');
      return;
    }
    try {
      const res = await api.openRides(token);
      const r = pickMatchingRide(res.rides, myVehicle);
      if (r) {
        // Clear so manual check can re-show
        shownIds.current.delete(r.id);
        offerRide(r);
        if (tripStatus === 'idle') {
          // presentIncomingRide will navigate via effect
        }
      } else {
        Alert.alert(
          'No nearby rides',
          `No open ${
            myVehicle === 'Scooty' || myVehicle === 'Bike'
              ? 'two-wheeler (Scooty/Bike)'
              : myVehicle
          } requests near you right now.`,
        );
      }
    } catch (e: any) {
      Alert.alert('Server', e.message || 'Check that the backend is running.');
    }
  };

  return (
    <Screen edges={['top']} style={styles.screen}>
      <View style={styles.mapArea}>
        <MapCanvas
          label={isOnline ? 'Broadcasting nearby' : 'Offline mode'}
          subtitle={
            locError
              ? locError
              : address ||
                (locLoading
                  ? 'Getting live GPS…'
                  : coords
                    ? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
                    : 'Enable location for matching')
          }
          showRoute={isOnline}
          coords={coords}
          loading={locLoading && !coords}
        />
        <View style={styles.mapTop}>
          <View style={styles.brandChip}>
            <Text style={styles.brandText}>Raydo Partner</Text>
          </View>
          <Pressable style={styles.bell} onPress={() => setupDriverNotifications()}>
            <Bell size={18} color={Colors.primary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.sheet}>
        <View style={styles.greetingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Namaste, {driver.name.split(' ')[0]}</Text>
            <Text style={styles.city}>
              {driver.city} · {driver.vehicleCategory}
              {sessionDriver?.loginId ? ` · ${sessionDriver.loginId}` : ''}
            </Text>
          </View>
          <View style={styles.ratingBadge}>
            <Star size={14} color={Colors.accent} fill={Colors.accent} />
            <Text style={styles.ratingText}>{driver.rating.toFixed(2)}</Text>
          </View>
        </View>

        <OnlineToggle online={isOnline} onChange={goOnline} disabled={busy} />

        {isOnline ? (
          <View style={styles.listenBanner}>
            <Zap size={16} color={Colors.accentDark} />
            <Text style={styles.listenText}>
              Listening for nearest requests · notifications on
            </Text>
          </View>
        ) : null}

        <View style={styles.stats}>
          <StatPill label="Today" value={formatInr(todayEarnings)} tone="success" />
          <StatPill label="Trips" value={String(todayTrips)} />
          <StatPill label="Total" value={String(driver.trips)} tone="accent" />
        </View>

        <View style={styles.actions}>
          <Button
            title="Check nearby requests"
            onPress={fetchOpenRides}
            fullWidth
            leftIcon={<Sparkles size={16} color={Colors.white} />}
          />
          {!token ? (
            <Button
              title="Demo request (offline mode)"
              variant="outline"
              onPress={simulateIncoming}
              fullWidth
            />
          ) : null}
          <Button
            title="Refresh GPS"
            variant="ghost"
            onPress={() => refreshLocation()}
            fullWidth
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: Colors.background },
  mapArea: { height: '36%', minHeight: 210 },
  mapTop: {
    position: 'absolute',
    top: 12,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandChip: {
    backgroundColor: 'rgba(15,28,63,0.82)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  brandText: { color: Colors.white, fontWeight: '800', fontSize: 12 },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.soft,
  },
  sheet: {
    flex: 1,
    marginTop: -18,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 18,
    gap: 14,
    ...Shadow.floating,
  },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hello: { fontSize: 22, fontWeight: '800', color: Colors.text },
  city: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  ratingText: { fontWeight: '800', color: Colors.primary, fontSize: 13 },
  listenBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accentSoft,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  listenText: { flex: 1, fontSize: 12, fontWeight: '700', color: Colors.accentDark },
  stats: { flexDirection: 'row', gap: 8 },
  actions: { gap: 8, marginTop: 4 },
});
