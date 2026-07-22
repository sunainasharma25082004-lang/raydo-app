import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Shadow } from '@/constants/Colors';
import { Clock, MapPin, Receipt } from 'lucide-react-native';

const RIDES = [
  {
    id: '1',
    pickup: 'Kempegowda Int. Airport',
    drop: 'Phoenix Marketcity',
    date: 'Jul 15, 2026',
    time: '14:30',
    fare: '₹205',
    vehicle: 'Auto',
    status: 'Completed',
    payment: 'UPI',
    emoji: '🛺',
  },
  {
    id: '2',
    pickup: 'HSR Layout Sector 2',
    drop: 'Indiranagar Metro',
    date: 'Jul 12, 2026',
    time: '09:15',
    fare: '₹145',
    vehicle: 'Bike',
    status: 'Completed',
    payment: 'Cash',
    emoji: '🏍',
  },
  {
    id: '3',
    pickup: 'BTM 2nd Stage',
    drop: 'Koramangala 3rd Block',
    date: 'Jul 10, 2026',
    time: '18:45',
    fare: '₹85',
    vehicle: 'Scooty',
    status: 'Completed',
    payment: 'UPI',
    emoji: '🛵',
  },
  {
    id: '4',
    pickup: 'MG Road Metro',
    drop: 'Cubbon Park',
    date: 'Jul 8, 2026',
    time: '11:20',
    fare: '₹220',
    vehicle: 'Car',
    status: 'Completed',
    payment: 'Card',
    emoji: '🚗',
  },
];

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Your rides</Text>
        <Text style={styles.sub}>{RIDES.length} completed trips</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {RIDES.map((ride) => (
          <TouchableOpacity
            key={ride.id}
            style={styles.card}
            activeOpacity={0.9}
            onPress={() =>
              Alert.alert(
                ride.drop,
                `From: ${ride.pickup}\n${ride.date} · ${ride.time}\n${ride.vehicle} · ${ride.payment}\nFare: ${ride.fare}`,
              )
            }
          >
            <View style={styles.top}>
              <View style={styles.dateWrap}>
                <Clock color={Colors.textLight} size={13} />
                <Text style={styles.date}>
                  {ride.date} · {ride.time}
                </Text>
              </View>
              <Text style={styles.fare}>{ride.fare}</Text>
            </View>

            <View style={styles.mid}>
              <View style={styles.emojiBox}>
                <Text style={{ fontSize: 22 }}>{ride.emoji}</Text>
              </View>
              <View style={styles.route}>
                <View style={styles.routeLeft}>
                  <View style={styles.dot} />
                  <View style={styles.line} />
                  <MapPin size={13} color={Colors.accent} />
                </View>
                <View style={styles.routeRight}>
                  <Text style={styles.place} numberOfLines={1}>
                    {ride.pickup}
                  </Text>
                  <Text style={[styles.place, styles.drop]} numberOfLines={1}>
                    {ride.drop}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.meta}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>{ride.vehicle}</Text>
              </View>
              <View style={styles.chip}>
                <Receipt size={11} color={Colors.textLight} />
                <Text style={styles.chipText}>{ride.payment}</Text>
              </View>
              <View style={[styles.chip, styles.chipOk]}>
                <Text style={[styles.chipText, styles.chipOkText]}>{ride.status}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.4,
  },
  sub: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 4,
    fontWeight: '600',
  },
  list: { paddingBottom: 32 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.soft,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  date: { fontSize: 12, color: Colors.textLight, fontWeight: '600' },
  fare: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  mid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  emojiBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  route: { flex: 1, flexDirection: 'row', gap: 10 },
  routeLeft: { alignItems: 'center', width: 14, paddingTop: 4 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 16,
    backgroundColor: Colors.borderStrong,
    marginVertical: 3,
  },
  routeRight: { flex: 1, gap: 10 },
  place: { fontSize: 13, color: Colors.textLight, fontWeight: '500' },
  drop: { color: Colors.text, fontWeight: '700' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipOk: { backgroundColor: Colors.successSoft },
  chipText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  chipOkText: { color: Colors.success },
});
