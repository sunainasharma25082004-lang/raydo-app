import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  MessageCircle,
  Navigation,
  Phone,
  MapPin,
  Flag,
} from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { MapCanvas } from '@/components/ui/MapCanvas';
import { Button } from '@/components/ui/Button';
import { useDriver } from '@/context/DriverContext';
import { formatInr } from '@/data/mock';
import { Colors, Radius, Shadow } from '@/constants/Colors';

export default function TripScreen() {
  const router = useRouter();
  const {
    tripStatus,
    activeRequest,
    arrivedAtPickup,
    startTrip,
    completeTrip,
  } = useDriver();

  if (!activeRequest) {
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
    tripStatus === 'to_pickup'
      ? {
          title: 'Navigate to pickup',
          subtitle: activeRequest.pickup,
          cta: 'Arrived at pickup',
          onCta: arrivedAtPickup,
          mapLabel: 'En route to rider',
        }
      : tripStatus === 'waiting'
        ? {
            title: 'Waiting for rider',
            subtitle: activeRequest.riderName,
            cta: 'Start trip',
            onCta: startTrip,
            mapLabel: 'At pickup point',
          }
        : {
            title: 'Trip in progress',
            subtitle: activeRequest.drop,
            cta: 'Complete trip',
            onCta: () => {
              completeTrip(5);
              router.replace('/driver/complete');
            },
            mapLabel: 'Heading to drop',
          };

  return (
    <Screen edges={['top']} style={styles.screen}>
      <View style={styles.map}>
        <MapCanvas
          label={stage.mapLabel}
          subtitle={`${activeRequest.distanceKm} km · ${activeRequest.etaMin} min ETA`}
          showRoute
        />
        <View style={styles.topChip}>
          <Navigation size={14} color={Colors.white} />
          <Text style={styles.topChipText}>
            {tripStatus === 'in_trip' ? 'ON TRIP' : tripStatus === 'waiting' ? 'WAITING' : 'TO PICKUP'}
          </Text>
        </View>
      </View>

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>{stage.title}</Text>
            <Text style={styles.title} numberOfLines={1}>
              {stage.subtitle}
            </Text>
          </View>
          <View style={styles.fareBox}>
            <Text style={styles.fare}>{formatInr(activeRequest.fare)}</Text>
            <Text style={styles.pay}>{activeRequest.payment}</Text>
          </View>
        </View>

        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={styles.iconBubble}>
              <MapPin size={16} color={Colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>Pickup</Text>
              <Text style={styles.routeValue} numberOfLines={1}>
                {activeRequest.pickup}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.routeRow}>
            <View style={[styles.iconBubble, { backgroundColor: Colors.accentSoft }]}>
              <Flag size={16} color={Colors.accentDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>Drop</Text>
              <Text style={styles.routeValue} numberOfLines={1}>
                {activeRequest.drop}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.contactRow}>
          <Pressable
            style={styles.contactBtn}
            onPress={() => Linking.openURL('tel:9876543210')}
          >
            <Phone size={18} color={Colors.primary} />
            <Text style={styles.contactText}>Call</Text>
          </Pressable>
          <Pressable style={styles.contactBtn}>
            <MessageCircle size={18} color={Colors.primary} />
            <Text style={styles.contactText}>Chat</Text>
          </Pressable>
          <View style={styles.riderChip}>
            <Text style={styles.riderName}>{activeRequest.riderName}</Text>
            <Text style={styles.riderMeta}>★ {activeRequest.riderRating}</Text>
          </View>
        </View>

        <Button title={stage.cta} onPress={stage.onCta} fullWidth size="lg" variant="primary" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: Colors.background },
  map: { height: '46%', minHeight: 280 },
  topChip: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -70,
    width: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: Radius.full,
    ...Shadow.soft,
  },
  topChipText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.6,
  },
  sheet: {
    flex: 1,
    marginTop: -24,
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 2,
  },
  fareBox: {
    backgroundColor: Colors.accentSoft,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'flex-end',
  },
  fare: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  pay: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  routeCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    ...Shadow.soft,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textLight,
    textTransform: 'uppercase',
  },
  routeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
    marginLeft: 48,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactBtn: {
    width: 72,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  contactText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  riderChip: {
    flex: 1,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  riderName: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 14,
  },
  riderMeta: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 2,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
