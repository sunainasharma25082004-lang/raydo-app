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
import { Href, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Shadow } from '@/constants/Colors';
import {
  User,
  CreditCard,
  Clock,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  FileText,
  Info,
  Shield,
  Star,
} from 'lucide-react-native';
import { clearRiderLogin } from '@/lib/session';

const RIDE_HISTORY = [
  { id: '1', destination: 'Phoenix Marketcity', date: 'Jul 15, 14:30', fare: '₹205', vehicle: 'Auto' },
  { id: '2', destination: 'Indiranagar Metro', date: 'Jul 12, 09:15', fare: '₹145', vehicle: 'Bike' },
  { id: '3', destination: 'Koramangala 3rd Block', date: 'Jul 10, 18:45', fare: '₹85', vehicle: 'Scooty' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 8) }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.headerTitle}>Profile</Text>
        <Text style={styles.headerSub}>Manage account & preferences</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>RS</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>Rahul Sharma</Text>
            <Text style={styles.phone}>+91 98765 43210</Text>
            <View style={styles.ratingRow}>
              <Star size={12} color={Colors.accent} fill={Colors.accent} />
              <Text style={styles.ratingText}>4.9 · Premium rider</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push('/edit-profile' as Href)}
          >
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>48</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>₹12k</Text>
            <Text style={styles.statLabel}>Spent</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>6</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
        </View>

        <View style={styles.section}>
          <MenuRow
            icon={<CreditCard color={Colors.primary} size={18} />}
            label="Payment methods"
            onPress={() => router.push('/payment-methods' as Href)}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent rides</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/history' as Href)}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {RIDE_HISTORY.map((ride, index) => (
            <View key={ride.id}>
              <TouchableOpacity
                style={styles.rideRow}
                onPress={() =>
                  Alert.alert(
                    ride.destination,
                    `${ride.date}\n${ride.vehicle} · ${ride.fare}`,
                    [
                      {
                        text: 'View History',
                        onPress: () => router.push('/(tabs)/history' as Href),
                      },
                      { text: 'OK', style: 'cancel' },
                    ],
                  )
                }
              >
                <View style={styles.rideIconBg}>
                  <Clock color={Colors.textLight} size={18} />
                </View>
                <View style={styles.rideInfo}>
                  <Text style={styles.rideDest} numberOfLines={1}>
                    {ride.destination}
                  </Text>
                  <Text style={styles.rideMeta}>
                    {ride.date} · {ride.vehicle}
                  </Text>
                </View>
                <Text style={styles.rideFare}>{ride.fare}</Text>
              </TouchableOpacity>
              {index < RIDE_HISTORY.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <MenuRow
            icon={<Settings color={Colors.primary} size={18} />}
            label="Settings"
            onPress={() => router.push('/settings' as Href)}
          />
          <View style={styles.divider} />
          <MenuRow
            icon={<HelpCircle color={Colors.primary} size={18} />}
            label="Help & Support"
            onPress={() => router.push('/help-support' as Href)}
          />
          <View style={styles.divider} />
          <MenuRow
            icon={<Info color={Colors.primary} size={18} />}
            label="About Us"
            onPress={() => router.push('/about' as Href)}
          />
          <View style={styles.divider} />
          <MenuRow
            icon={<Shield color={Colors.primary} size={18} />}
            label="Privacy Policy"
            onPress={() => router.push('/privacy' as Href)}
          />
          <View style={styles.divider} />
          <MenuRow
            icon={<FileText color={Colors.primary} size={18} />}
            label="Terms of Service"
            onPress={() =>
              Alert.alert(
                'Terms of Service',
                'By using Raydo you agree to fair use of the platform and respectful behaviour with drivers.',
              )
            }
          />
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() =>
            Alert.alert('Log out?', 'You can sign back in anytime.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Log Out',
                style: 'destructive',
                onPress: async () => {
                  await clearRiderLogin();
                  router.replace('/rider/login');
                },
              },
            ])
          }
        >
          <LogOut color={Colors.error} size={18} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Raydo Rider · v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.iconBg}>{icon}</View>
      <Text style={styles.rowText}>{label}</Text>
      <ChevronRight color={Colors.textLight} size={18} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 13,
    color: Colors.textLight,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 18,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: Radius.xl,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: Colors.accent,
    fontSize: 20,
    fontWeight: '800',
  },
  profileInfo: { flex: 1 },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  phone: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 2,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.accentSoft,
    borderRadius: Radius.full,
  },
  editText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.accentDark,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 4,
    fontWeight: '600',
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.soft,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accentDark,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
  },
  rideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rideIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rideInfo: {
    flex: 1,
    marginRight: 10,
  },
  rideDest: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  rideMeta: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
  },
  rideFare: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    paddingVertical: 16,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.errorSoft,
    marginBottom: 14,
  },
  logoutText: {
    color: Colors.error,
    fontSize: 15,
    fontWeight: '800',
  },
  version: {
    textAlign: 'center',
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '600',
  },
});
