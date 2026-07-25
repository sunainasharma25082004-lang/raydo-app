import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
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

/** Open native dial pad with this number (India-friendly). */
function openDialPad(raw?: string | null, label = 'Number') {
  if (!raw || !String(raw).trim()) {
    Alert.alert(`${label} unavailable`, 'Phone number not available yet.');
    return;
  }
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length < 8) {
    Alert.alert('Invalid number', String(raw));
    return;
  }
  let tel = digits;
  if (digits.length === 10) tel = `+91${digits}`;
  else if (digits.startsWith('91') && digits.length === 12) tel = `+${digits}`;
  else if (digits.length > 10) tel = `+${digits}`;

  Linking.openURL(`tel:${tel}`).catch(() => {
    Alert.alert('Could not open dialer', tel);
  });
}

export default function TripScreen() {
  const router = useRouter();
  const { token } = useSession();
  const {
    tripStatus,
    activeRequest,
    arrivedAtPickup,
    startTrip,
    completeTrip,
    resetToIdle,
    setActiveFromServerRide,
  } = useDriver();
  const [liveRide, setLiveRide] = useState<LiveRide | null>(null);
  const [loading, setLoading] = useState(true);
  const [goingHome, setGoingHome] = useState(false);
  const { coords, address } = useCurrentLocation({ watch: true, highAccuracy: true });

  const goHome = useCallback(() => {
    if (goingHome) return;
    setGoingHome(true);
    try {
      resetToIdle();
    } catch {
      /* ignore */
    }
    try {
      router.dismissAll();
    } catch {
      /* ignore */
    }
    setTimeout(() => {
      try {
        router.replace('/driver/(tabs)/home');
      } catch {
        router.navigate('/driver/(tabs)/home' as any);
      }
      setGoingHome(false);
    }, 50);
  }, [goingHome, resetToIdle, router]);

  const goToComplete = useCallback(
    (ride?: LiveRide | null) => {
      const fare = ride?.fare ?? activeRequest?.fare ?? 0;
      completeTrip(5, {
        fare,
        pickup: ride?.pickup || activeRequest?.pickup,
        drop: ride?.drop || activeRequest?.drop,
        distanceKm: ride?.distanceKm || activeRequest?.distanceKm,
        payment: 'UPI',
      });
      setLiveRide(null);
      router.replace({
        pathname: '/driver/complete',
        params: {
          fare: String(fare),
          pickup: ride?.pickup || activeRequest?.pickup || '',
          drop: ride?.drop || activeRequest?.drop || '',
          riderName: ride?.riderName || activeRequest?.riderName || 'Rider',
          rideId: ride?.id || activeRequest?.id || '',
          distanceKm: String(ride?.distanceKm || activeRequest?.distanceKm || 0),
        },
      });
    },
    [activeRequest, completeTrip, router],
  );

  const loadActive = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.activeRide(token);
      const ride = res.ride;
      // Completed / cancelled rides are not "active" — don't trap driver here
      if (ride && ['Completed', 'Cancelled'].includes(ride.status)) {
        setLiveRide(null);
        return;
      }
      setLiveRide(ride);
      // Keep local context in sync so complete screen has fare/route
      if (ride && !activeRequest) {
        setActiveFromServerRide(ride);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [token, activeRequest, setActiveFromServerRide]);

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
        goToComplete(null);
      }
      return;
    }
    try {
      const res = await api.updateRideStatus(token, liveRide.id, status);
      setLiveRide(res.ride);
      if (status === 'Arrived') arrivedAtPickup();
      if (status === 'In_Progress') startTrip();
      if (status === 'Completed') {
        goToComplete(res.ride);
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
  const statusForChat =
    liveRide?.status ||
    (tripStatus === 'to_pickup' ? 'Accepted' : tripStatus === 'waiting' ? 'Arrived' : '');
  const canChat =
    liveRide?.chatEnabled !== false && ['Accepted', 'Arrived'].includes(statusForChat);

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
          <Text style={styles.emptyHint}>Trip finished or not loaded. Head back to home.</Text>
          <TouchableOpacity
            style={[styles.homeBtn, goingHome && { opacity: 0.7 }]}
            onPress={goHome}
            activeOpacity={0.85}
            disabled={goingHome}
          >
            <Text style={styles.homeBtnText}>{goingHome ? 'Going home…' : 'Go to Home'}</Text>
          </TouchableOpacity>
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
            onPress={() => openDialPad(phone, 'Rider number')}
            accessibilityRole="button"
            accessibilityLabel="Call rider"
          >
            <Phone size={18} color={Colors.primary} />
          </Pressable>
          <Pressable
            style={[
              styles.iconBtn,
              !canChat && styles.iconBtnDisabled,
            ]}
            onPress={() => {
              if (!canChat) {
                Alert.alert(
                  'Chat closed',
                  'Chat is only available until pickup. After the trip starts, messaging is disabled.',
                );
                return;
              }
              if (!liveRide?.id) return;
              router.push({
                pathname: '/driver/chat',
                params: {
                  rideId: liveRide.id,
                  riderName,
                },
              });
            }}
          >
            <MessageCircle size={18} color={canChat ? Colors.primary : Colors.textLight} />
          </Pressable>
        </View>

        {canChat ? (
          <Text style={styles.chatHint}>Chat open — closes when you start the trip</Text>
        ) : liveRide?.status === 'In_Progress' || liveRide?.status === 'Completed' ? (
          <Text style={styles.chatClosed}>Chat closed after pickup</Text>
        ) : null}

        {liveRide?.pickupEtaMinutes != null ? (
          <Text style={styles.etaHint}>
            Rider notified · ETA ~{liveRide.pickupEtaMinutes} min to pickup
          </Text>
        ) : null}

        <Button title={stage.cta} fullWidth onPress={stage.onCta} />
        <TouchableOpacity style={styles.leaveBtn} onPress={goHome} activeOpacity={0.85}>
          <Text style={styles.leaveBtnText}>End / leave trip</Text>
        </TouchableOpacity>
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
  iconBtnDisabled: { opacity: 0.5 },
  chatHint: { fontSize: 12, fontWeight: '700', color: Colors.success },
  chatClosed: { fontSize: 12, fontWeight: '700', color: Colors.error },
  etaHint: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  emptyText: { color: Colors.text, fontWeight: '800', fontSize: 18 },
  emptyHint: {
    color: Colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  homeBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: Radius.md,
    minWidth: 200,
    alignItems: 'center',
  },
  homeBtnText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
  leaveBtn: {
    borderWidth: 1.5,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  leaveBtnText: { color: Colors.primary, fontWeight: '800', fontSize: 15 },
});
