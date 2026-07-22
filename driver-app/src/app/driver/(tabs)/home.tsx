import React, { useEffect, useRef } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Sparkles, Star, Zap } from 'lucide-react-native';
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
import { api, LiveRide } from '@/lib/api';

function pickMatchingRide(rides: LiveRide[] | undefined, driverVehicle?: string | null) {
  if (!rides?.length) return null;
  const matched = rides.filter((r) =>
    driverVehicle ? vehiclesMatch(driverVehicle, r.vehicleType) : true,
  );
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
  } = useDriver();
  const { token, driver: sessionDriver } = useSession();
  const myVehicle = sessionDriver?.vehicle?.type || driver.vehicleCategory;
  const { coords, address, loading: locLoading, error: locError, refresh: refreshLocation } =
    useCurrentLocation({ watch: true, highAccuracy: true });
  const lastNavStatus = useRef<string | null>(null);

  // Real GPS → backend + rider sockets while online
  useLiveLocationSync({ enabled: isOnline, isOnline });

  useEffect(() => {
    // Prevent push loops when home re-renders under the request modal
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

  // Auto-check server for real rider requests while online (same vehicle only)
  useEffect(() => {
    if (!isOnline || !token || tripStatus !== 'idle') return;
    let cancelled = false;
    let shownId: string | null = null;
    const check = async () => {
      try {
        const res = await api.openRides(token);
        if (cancelled) return;
        const r = pickMatchingRide(res.rides, myVehicle);
        if (!r || r.id === shownId) return;
        shownId = r.id;
        Alert.alert(
          `Live ${r.vehicleType} request`,
          `${r.riderName}\n${r.pickup} → ${r.drop}\n₹${r.fare} · ${r.vehicleType}\n(Matched to your ${myVehicle})`,
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Accept & go',
              onPress: async () => {
                try {
                  await api.acceptRide(token, r.id);
                  router.push('/driver/trip');
                } catch (e: any) {
                  Alert.alert('Accept failed', e.message);
                  shownId = null;
                }
              },
            },
          ],
        );
      } catch {
        /* backend offline */
      }
    };
    check();
    const t = setInterval(check, 8000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [isOnline, token, tripStatus, router, myVehicle]);

  const busy = tripStatus !== 'idle' && tripStatus !== 'incoming';

  const goOnline = async (value: boolean) => {
    setOnline(value);
    if (token) {
      try {
        await api.setOnline(
          token,
          value,
          coords?.latitude,
          coords?.longitude,
        );
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
        Alert.alert(
          `Nearby ${r.vehicleType}`,
          `${r.riderName}\n${r.pickup} → ${r.drop}\n₹${r.fare} · ${r.vehicleType}\nYour vehicle: ${myVehicle}`,
          [
            { text: 'Ignore', style: 'cancel' },
            {
              text: 'Accept',
              onPress: async () => {
                try {
                  await api.acceptRide(token, r.id);
                  router.push('/driver/trip');
                } catch (e: any) {
                  Alert.alert('Accept failed', e.message);
                }
              },
            },
          ],
        );
      } else {
        Alert.alert(
          'No matching rides',
          `No open ${myVehicle === 'Scooty' || myVehicle === 'Bike' ? 'two-wheeler (Scooty/Bike)' : myVehicle} requests right now.\n\nRiders who book other vehicle types will not appear here.`,
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
              : address || (isOnline ? 'Waiting for ride requests' : 'Go online to start')
          }
          showRoute={false}
          coords={coords}
          loading={locLoading}
        />

        <View style={styles.topBar}>
          <View style={styles.identity}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {driver.name
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)}
              </Text>
            </View>
            <View>
              <Text style={styles.hello}>Hello, {driver.name.split(' ')[0]}</Text>
              <View style={styles.ratingRow}>
                <Star size={12} color={Colors.accent} fill={Colors.accent} />
                <Text style={styles.ratingText}>
                  {driver.rating} · {driver.vehicle}
                </Text>
              </View>
            </View>
          </View>

          <Pressable style={styles.bell}>
            <Bell size={20} color={Colors.primary} />
            <View style={styles.dot} />
          </Pressable>
        </View>
      </View>

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <OnlineToggle online={isOnline} onChange={goOnline} disabled={busy} />

        <View style={styles.stats}>
          <StatPill
            label="Today"
            value={formatInr(todayEarnings)}
            tone="accent"
            icon={<Zap size={16} color={Colors.accentDark} />}
          />
          <StatPill
            label="Trips"
            value={String(todayTrips)}
            tone="success"
            icon={<Sparkles size={16} color={Colors.success} />}
          />
          <StatPill label="Rating" value={String(driver.rating)} />
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>
            {isOnline ? 'You are live' : 'Quick start'}
          </Text>
          <Text style={styles.tipBody}>
            {coords
              ? `Live GPS active${coords.accuracy != null ? ` (±${Math.round(coords.accuracy)}m)` : ''}. ${
                  isOnline
                    ? `Only ${
                        myVehicle === 'Scooty' || myVehicle === 'Bike'
                          ? 'Scooty / Bike (two-wheeler)'
                          : myVehicle
                      } requests will come to you — not other vehicles.`
                    : 'Go online to receive matching vehicle requests near you.'
                }`
              : locLoading
                ? 'Requesting location permission and GPS fix…'
                : 'Location not available yet. Tap below to allow GPS access.'}
          </Text>
          {!coords ? (
            <Button
              title="Enable location access"
              variant="accent"
              onPress={refreshLocation}
              style={{ marginTop: 12 }}
              fullWidth
            />
          ) : null}
          {isOnline && tripStatus === 'idle' ? (
            <Button
              title="Check live ride requests"
              variant="accent"
              onPress={fetchOpenRides}
              style={{ marginTop: 12 }}
              fullWidth
            />
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: Colors.background },
  mapArea: {
    height: '42%',
    minHeight: 260,
  },
  topBar: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.soft,
    maxWidth: '78%',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 12,
  },
  hello: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.soft,
  },
  dot: {
    position: 'absolute',
    top: 12,
    right: 13,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    borderWidth: 1,
    borderColor: Colors.white,
  },
  sheet: {
    flex: 1,
    marginTop: -22,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 10,
    gap: 14,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderStrong,
    marginBottom: 4,
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
  },
  tipCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    ...Shadow.soft,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  tipBody: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
  },
});
