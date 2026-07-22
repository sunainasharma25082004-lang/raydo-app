import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MessageCircle, Navigation, Phone, MapPin, Flag } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { MapCanvas } from '@/components/ui/MapCanvas';
import { Button } from '@/components/ui/Button';
import { useDriver } from '@/context/DriverContext';
import { useSession } from '@/context/SessionContext';
import { useLiveLocationSync } from '@/hooks/use-live-location-sync';
import { useCurrentLocation } from '@/hooks/use-current-location';
import { api, LiveRide } from '@/lib/api';
import { formatInr } from '@/data/mock';
import { Colors, Radius, Shadow } from '@/constants/Colors';

export default function TripScreen() {
  const router = useRouter();
  const { token } = useSession();
  const { tripStatus, activeRequest, arrivedAtPickup, startTrip, completeTrip, resetToIdle } =
    useDriver();
  const [liveRide, setLiveRide] = useState<LiveRide | null>(null);
  const [loading, setLoading] = useState(true);
  const { coords, address } = useCurrentLocation({ watch: true, highAccuracy: true });

  const loadActive = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.activeRide(token);
      setLiveRide(res.ride);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadActive();
      const t = setInterval(loadActive, 5000);
      return () => clearInterval(t);
    }, [loadActive]),
  );

  // Stream GPS to rider while on this trip
  useLiveLocationSync({
    enabled: true,
    isOnline: true,
    rideId: liveRide?.id || null,
  });

  const updateStatus = async (status: string) => {
    if (!token || !liveRide) {
      // fallback local demo flow
      if (status === 'Arrived') arrivedAtPickup();
      else if (status === 'In_Progress') startTrip();
      else if (status === 'Completed') {
        completeTrip(5);
        router.replace('/driver/complete');
      }
      return;
    }
    try {
      const res = await api.updateRideStatus(token, liveRide.id, status);
      setLiveRide(res.ride);
      if (status === 'Arrived') arrivedAtPickup();
      if (status === 'In_Progress') startTrip();
      if (status === 'Completed') {
        completeTrip(5);
        router.replace('/driver/complete');
      }
    } catch (e: any) {
      Alert.alert('Update failed', e.message);
    }
  };

  const pickup = liveRide?.pickup || activeRequest?.pickup || 'Pickup';
  const drop = liveRide?.drop || activeRequest?.drop || 'Drop';
  const riderName = liveRide?.riderName || activeRequest?.riderName || 'Rider';
  const fare = liveRide?.fare ?? activeRequest?.fare ?? 0;
  const phone = liveRide?.riderPhone || '';

  if (loading && !activeRequest && !liveRide) {
    return (
      <Screen>
        <View style={styles.empty}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.emptyText}>Loading live trip…</Text>
        </View>
      </Screen>
    );
  }

  if (!activeRequest && !liveRide) {
    return (
      <Screen>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No active trip</Text>
          <Button title="Go home" onPress={() => router.replace('/driver/(tabs)/home')} />
        </View>
      </Screen>
    );
  }

  const stage =
    tripStatus === 'to_pickup' || liveRide?.status === 'Accepted'
      ? {
          title: 'Navigate to pickup',
          subtitle: pickup,
          cta: 'Arrived at pickup',
          onCta: () => updateStatus('Arrived'),
          mapLabel: 'En route to rider',
        }
      : tripStatus === 'waiting' || liveRide?.status === 'Arrived'
        ? {
            title: 'Waiting for rider',
            subtitle: riderName,
            cta: 'Start trip',
            onCta: () => updateStatus('In_Progress'),
            mapLabel: 'At pickup point',
          }
        : {
            title: 'Trip in progress',
            subtitle: drop,
            cta: 'Complete trip',
            onCta: () => updateStatus('Completed'),
            mapLabel: 'Heading to drop',
          };

  return (
    <Screen edges={['top']} style={styles.screen}>
      <View style={styles.map}>
        <MapCanvas
          label={stage.mapLabel}
          subtitle={address || 'Sharing live GPS with rider'}
          showRoute
          coords={coords}
          loading={!coords}
        />
        <View style={styles.topChip}>
          <Navigation size={14} color={Colors.white} />
          <Text style={styles.topChipText}>
            {coords
              ? `LIVE ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
              : 'Getting GPS…'}
          </Text>
        </View>
      </View>

      <View style={styles.sheet}>
        <Text style={styles.kicker}>{liveRide?.status || tripStatus}</Text>
        <Text style={styles.title}>{stage.title}</Text>
        <Text style={styles.sub}>{stage.subtitle}</Text>

        {coords ? (
          <Text style={styles.gps}>
            Your live location updates on the rider map every ~2–3 seconds
          </Text>
        ) : (
          <Text style={styles.gpsWarn}>
            Allow location access so the rider can track you
          </Text>
        )}

        <View style={styles.route}>
          <View style={styles.routeRow}>
            <MapPin size={16} color={Colors.success} />
            <Text style={styles.routeText} numberOfLines={2}>
              {pickup}
            </Text>
          </View>
          <View style={styles.routeRow}>
            <Flag size={16} color={Colors.accent} />
            <Text style={styles.routeText} numberOfLines={2}>
              {drop}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.fare}>{formatInr(fare)}</Text>
          <Text style={styles.rider}>{riderName}</Text>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => phone && Linking.openURL(`tel:${phone}`)}
          >
            <Phone size={18} color={Colors.primary} />
          </Pressable>
          <Pressable style={styles.iconBtn}>
            <MessageCircle size={18} color={Colors.primary} />
          </Pressable>
        </View>

        <Button title={stage.cta} fullWidth onPress={stage.onCta} />
        <Button
          title="End / leave trip"
          variant="outline"
          fullWidth
          onPress={() => {
            resetToIdle();
            router.replace('/driver/(tabs)/home');
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: Colors.background },
  map: { height: '38%', minHeight: 220 },
  topChip: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  topChipText: { color: Colors.white, fontWeight: '800', fontSize: 11 },
  sheet: {
    flex: 1,
    backgroundColor: Colors.background,
    marginTop: -18,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    gap: 10,
    ...Shadow.floating,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.accentDark,
    textTransform: 'uppercase',
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  sub: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  gps: { fontSize: 12, color: Colors.success, fontWeight: '700' },
  gpsWarn: { fontSize: 12, color: Colors.warning, fontWeight: '700' },
  route: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeText: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.text },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fare: { fontSize: 24, fontWeight: '800', color: Colors.primary },
  rider: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  actionsRow: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  emptyText: { color: Colors.textSecondary, fontWeight: '600' },
});
