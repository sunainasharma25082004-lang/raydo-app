import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TrendingUp, Wallet } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { useDriver } from '@/context/DriverContext';
import { WEEKLY_EARNINGS, formatInr } from '@/data/mock';
import { Colors, Radius } from '@/constants/Colors';

export default function EarningsScreen() {
  const { todayEarnings, todayTrips, history } = useDriver();

  const weekTotal = useMemo(
    () => WEEKLY_EARNINGS.reduce((s, d) => s + d.amount, 0) + todayEarnings,
    [todayEarnings]
  );

  const maxBar = Math.max(...WEEKLY_EARNINGS.map((d) => d.amount), 1);
  const avgTrip =
    history.length > 0
      ? Math.round(history.reduce((s, h) => s + h.fare, 0) / history.length)
      : 0;

  return (
    <Screen scroll contentStyle={styles.content}>
      <Text style={styles.title}>Earnings</Text>
      <Text style={styles.sub}>Track daily performance and weekly trends</Text>

      <Card style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.iconBubble}>
            <Wallet size={20} color={Colors.primary} />
          </View>
          <View style={styles.badge}>
            <TrendingUp size={12} color={Colors.success} />
            <Text style={styles.badgeText}>+12% this week</Text>
          </View>
        </View>
        <Text style={styles.heroLabel}>This week</Text>
        <Text style={styles.heroValue}>{formatInr(weekTotal)}</Text>
        <Text style={styles.heroHint}>Includes today&apos;s live demo earnings</Text>
      </Card>

      <View style={styles.row}>
        <Card style={styles.mini}>
          <Text style={styles.miniLabel}>Today</Text>
          <Text style={styles.miniValue}>{formatInr(todayEarnings)}</Text>
          <Text style={styles.miniMeta}>{todayTrips} trips</Text>
        </Card>
        <Card style={styles.mini}>
          <Text style={styles.miniLabel}>Avg / trip</Text>
          <Text style={styles.miniValue}>{formatInr(avgTrip)}</Text>
          <Text style={styles.miniMeta}>{history.length} logged</Text>
        </Card>
      </View>

      <Card>
        <Text style={styles.sectionTitle}>Weekly chart</Text>
        <View style={styles.chart}>
          {WEEKLY_EARNINGS.map((d) => (
            <View key={d.day} style={styles.barCol}>
              <Text style={styles.barValue}>{Math.round(d.amount / 100) / 10}k</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { height: `${Math.max((d.amount / maxBar) * 100, 8)}%` },
                  ]}
                />
              </View>
              <Text style={styles.barDay}>{d.day}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Payout summary</Text>
        <View style={styles.line}>
          <Text style={styles.lineLabel}>Gross earnings</Text>
          <Text style={styles.lineValue}>{formatInr(weekTotal)}</Text>
        </View>
        <View style={styles.line}>
          <Text style={styles.lineLabel}>Platform fee (demo)</Text>
          <Text style={[styles.lineValue, { color: Colors.error }]}>
            -{formatInr(Math.round(weekTotal * 0.12))}
          </Text>
        </View>
        <View style={[styles.line, styles.lineLast]}>
          <Text style={styles.lineLabelBold}>Net payout</Text>
          <Text style={styles.lineValueBold}>
            {formatInr(Math.round(weekTotal * 0.88))}
          </Text>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 14,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
  },
  sub: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: -6,
    marginBottom: 4,
  },
  heroCard: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
  },
  heroValue: {
    color: Colors.white,
    fontSize: 36,
    fontWeight: '800',
    marginTop: 4,
  },
  heroHint: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  mini: { flex: 1 },
  miniLabel: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '700',
  },
  miniValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 6,
  },
  miniMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 14,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
    gap: 6,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 6,
  },
  barValue: {
    fontSize: 9,
    color: Colors.textLight,
    fontWeight: '600',
  },
  barTrack: {
    width: '70%',
    flex: 1,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 8,
    minHeight: 8,
  },
  barDay: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lineLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
    paddingTop: 12,
  },
  lineLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  lineValue: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  lineLabelBold: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  lineValueBold: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
});
