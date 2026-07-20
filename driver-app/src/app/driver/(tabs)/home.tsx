import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Sparkles, Star, Zap } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { MapCanvas } from '@/components/ui/MapCanvas';
import { OnlineToggle } from '@/components/driver/OnlineToggle';
import { StatPill } from '@/components/driver/StatPill';
import { Button } from '@/components/ui/Button';
import { useDriver } from '@/context/DriverContext';
import { formatInr } from '@/data/mock';
import { Colors, Radius, Shadow } from '@/constants/Colors';

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

  useEffect(() => {
    if (tripStatus === 'incoming') {
      router.push('/driver/request');
    } else if (tripStatus === 'to_pickup' || tripStatus === 'waiting' || tripStatus === 'in_trip') {
      router.push('/driver/trip');
    } else if (tripStatus === 'completed') {
      router.push('/driver/complete');
    }
  }, [tripStatus, router]);

  const busy = tripStatus !== 'idle' && tripStatus !== 'incoming';

  return (
    <Screen edges={['top']} style={styles.screen}>
      <View style={styles.mapArea}>
        <MapCanvas
          label={isOnline ? 'Broadcasting nearby' : 'Offline mode'}
          subtitle={isOnline ? 'Waiting for ride requests' : 'Go online to start'}
          showRoute={false}
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

        <OnlineToggle online={isOnline} onChange={setOnline} disabled={busy} />

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
            {isOnline
              ? 'Stay near high-demand areas. A demo request will arrive shortly, or trigger one now.'
              : 'Toggle online to receive ride requests. No backend needed — this is a full frontend demo flow.'}
          </Text>
          {isOnline && tripStatus === 'idle' ? (
            <Button
              title="Simulate ride request"
              variant="accent"
              onPress={simulateIncoming}
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
