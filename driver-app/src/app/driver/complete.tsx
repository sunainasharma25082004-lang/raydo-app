import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, Star, Home } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { useDriver } from '@/context/DriverContext';
import { formatInr } from '@/data/mock';
import { Colors, Radius } from '@/constants/Colors';

export default function CompleteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    fare?: string;
    pickup?: string;
    drop?: string;
    riderName?: string;
    rideId?: string;
    distanceKm?: string;
  }>();
  const { activeRequest, lastCompleted, resetToIdle } = useDriver();
  const [rating, setRating] = useState(5);
  const [goingHome, setGoingHome] = useState(false);

  const fare =
    Number(params.fare) ||
    lastCompleted?.fare ||
    activeRequest?.fare ||
    0;
  const pickup = params.pickup || lastCompleted?.pickup || activeRequest?.pickup || 'Pickup';
  const drop = params.drop || lastCompleted?.drop || activeRequest?.drop || 'Drop';
  const riderName = params.riderName || activeRequest?.riderName || 'Rider';
  const distanceKm =
    Number(params.distanceKm) || lastCompleted?.distanceKm || activeRequest?.distanceKm || 0;

  const goHome = () => {
    if (goingHome) return;
    setGoingHome(true);
    try {
      resetToIdle();
    } catch {
      /* ignore */
    }
    // Reliable navigation — try multiple paths (expo-router group routes)
    try {
      router.dismissAll();
    } catch {
      /* ignore */
    }
    setTimeout(() => {
      try {
        router.replace('/driver/(tabs)/home');
      } catch {
        try {
          router.navigate('/driver/(tabs)/home' as any);
        } catch {
          router.push('/driver/(tabs)/home');
        }
      }
      setGoingHome(false);
    }, 50);
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.check}>
          <CheckCircle2 size={42} color={Colors.success} />
        </View>
        <Text style={styles.title}>Trip completed</Text>
        <Text style={styles.sub}>Great job — earnings added for today</Text>
      </View>

      <Card style={styles.fareCard}>
        <Text style={styles.fareLabel}>You earned</Text>
        <Text style={styles.fareValue}>{formatInr(fare)}</Text>
        <Text style={styles.routeSummary}>
          {pickup} → {drop}
        </Text>
      </Card>

      <Card>
        <Text style={styles.rateTitle}>Rate your rider</Text>
        <Text style={styles.rateSub}>{riderName} · helps keep the community safe</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setRating(n)} hitSlop={12}>
              <Star
                size={34}
                color={Colors.accent}
                fill={n <= rating ? Colors.accent : 'transparent'}
              />
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <View style={styles.line}>
          <Text style={styles.lineLabel}>Trip fare</Text>
          <Text style={styles.lineValue}>{formatInr(fare)}</Text>
        </View>
        <View style={styles.line}>
          <Text style={styles.lineLabel}>Payment</Text>
          <Text style={styles.lineValue}>UPI → Admin</Text>
        </View>
        <View style={[styles.line, { borderBottomWidth: 0 }]}>
          <Text style={styles.lineLabel}>Distance</Text>
          <Text style={styles.lineValue}>{distanceKm ? `${distanceKm} km` : '—'}</Text>
        </View>
      </Card>

      {/* Primary CTA — TouchableOpacity is more reliable than Pressable on some Android builds */}
      <TouchableOpacity
        style={[styles.homeBtn, goingHome && styles.homeBtnDisabled]}
        onPress={goHome}
        activeOpacity={0.85}
        disabled={goingHome}
        accessibilityRole="button"
        accessibilityLabel="Go to home"
      >
        <Home color={Colors.white} size={20} />
        <Text style={styles.homeBtnText}>{goingHome ? 'Going home…' : 'Go to Home'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={goHome} activeOpacity={0.8}>
        <Text style={styles.secondaryText}>Back to dashboard</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 14,
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  check: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
  },
  sub: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  fareCard: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    gap: 4,
  },
  fareLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  fareValue: {
    color: Colors.white,
    fontSize: 40,
    fontWeight: '800',
  },
  routeSummary: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  rateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  rateSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 14,
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lineLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  lineValue: {
    color: Colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  homeBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  homeBtnDisabled: { opacity: 0.7 },
  homeBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
