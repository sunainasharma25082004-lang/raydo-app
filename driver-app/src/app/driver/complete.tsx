import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle2, Star } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useDriver } from '@/context/DriverContext';
import { formatInr } from '@/data/mock';
import { Colors, Radius } from '@/constants/Colors';

export default function CompleteScreen() {
  const router = useRouter();
  const { activeRequest, resetToIdle } = useDriver();
  const [rating, setRating] = useState(5);

  const fare = activeRequest?.fare ?? 0;

  const finish = () => {
    resetToIdle();
    router.replace('/driver/(tabs)/home');
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.check}>
          <CheckCircle2 size={42} color={Colors.success} />
        </View>
        <Text style={styles.title}>Trip completed</Text>
        <Text style={styles.sub}>Great job — earnings added to today&apos;s total</Text>
      </View>

      <Card style={styles.fareCard}>
        <Text style={styles.fareLabel}>You earned</Text>
        <Text style={styles.fareValue}>{formatInr(fare)}</Text>
        {activeRequest ? (
          <Text style={styles.routeSummary}>
            {activeRequest.pickup} → {activeRequest.drop}
          </Text>
        ) : null}
      </Card>

      <Card>
        <Text style={styles.rateTitle}>Rate your rider</Text>
        <Text style={styles.rateSub}>
          {activeRequest?.riderName ?? 'Rider'} · helps keep the community safe
        </Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setRating(n)} hitSlop={8}>
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
          <Text style={styles.lineValue}>{activeRequest?.payment ?? '—'}</Text>
        </View>
        <View style={[styles.line, { borderBottomWidth: 0 }]}>
          <Text style={styles.lineLabel}>Distance</Text>
          <Text style={styles.lineValue}>
            {activeRequest ? `${activeRequest.distanceKm} km` : '—'}
          </Text>
        </View>
      </Card>

      <Button title="Back to home" onPress={finish} fullWidth size="lg" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 14,
    paddingBottom: 28,
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
});
