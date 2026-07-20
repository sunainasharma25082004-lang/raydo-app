import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MapPin, Star } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { useDriver } from '@/context/DriverContext';
import { formatInr } from '@/data/mock';
import { Colors, Radius } from '@/constants/Colors';

export default function HistoryScreen() {
  const { history } = useDriver();

  return (
    <Screen scroll contentStyle={styles.content}>
      <Text style={styles.title}>Trip history</Text>
      <Text style={styles.sub}>{history.length} completed trips</Text>

      {history.map((trip) => (
        <Card key={trip.id} style={styles.card}>
          <View style={styles.top}>
            <View>
              <Text style={styles.date}>
                {trip.date} · {trip.time}
              </Text>
              <Text style={styles.fare}>{formatInr(trip.fare)}</Text>
            </View>
            <View style={styles.rating}>
              <Star size={12} color={Colors.accent} fill={Colors.accent} />
              <Text style={styles.ratingText}>{trip.rating}.0</Text>
            </View>
          </View>

          <View style={styles.route}>
            <View style={styles.routeLeft}>
              <View style={styles.dot} />
              <View style={styles.line} />
              <MapPin size={14} color={Colors.accent} />
            </View>
            <View style={styles.routeRight}>
              <Text style={styles.place} numberOfLines={1}>
                {trip.pickup}
              </Text>
              <Text style={[styles.place, styles.drop]} numberOfLines={1}>
                {trip.drop}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{trip.distanceKm} km</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{trip.payment}</Text>
            </View>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
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
    marginTop: -4,
    marginBottom: 4,
  },
  card: { gap: 12 },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  date: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '600',
  },
  fare: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.text,
  },
  route: {
    flexDirection: 'row',
    gap: 10,
  },
  routeLeft: {
    width: 16,
    alignItems: 'center',
    paddingTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.borderStrong,
    marginVertical: 3,
    minHeight: 18,
  },
  routeRight: {
    flex: 1,
    gap: 12,
  },
  place: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  drop: {
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
});
