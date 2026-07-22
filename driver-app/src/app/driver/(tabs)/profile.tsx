import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import {
  BadgeCheck,
  ChevronRight,
  FileText,
  HelpCircle,
  Info,
  LogOut,
  Settings,
  Shield,
  Star,
  Car,
} from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useDriver } from '@/context/DriverContext';
import { useSession } from '@/context/SessionContext';
import { Colors, Radius, Shadow } from '@/constants/Colors';

const MENU: { icon: typeof Car; label: string; value: string; href: Href }[] = [
  { icon: Car, label: 'Vehicle details', value: '', href: '/driver/vehicle' as Href },
  { icon: Shield, label: 'Documents / KYC', value: 'Verified', href: '/driver/documents' as Href },
  { icon: Settings, label: 'Preferences', value: '', href: '/driver/preferences' as Href },
  { icon: HelpCircle, label: 'Help & support', value: '', href: '/driver/help-support' as Href },
  { icon: Info, label: 'About Us', value: '', href: '/driver/about' as Href },
  { icon: FileText, label: 'Privacy Policy', value: '', href: '/driver/privacy' as Href },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { driver, todayTrips, todayEarnings } = useDriver();
  const { clearSession, driver: sessionDriver } = useSession();

  return (
    <Screen scroll contentStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>

      <Card style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {driver.name
              .split(' ')
              .map((p) => p[0])
              .join('')
              .slice(0, 2)}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{driver.name}</Text>
            <BadgeCheck size={18} color={Colors.success} />
          </View>
          <Text style={styles.phone}>{driver.phone}</Text>
          {driver.loginId ? (
            <Text style={styles.phone}>ID: {driver.loginId}</Text>
          ) : null}
          <Text style={styles.phone}>
            {driver.vehicleCategory} · KYC {sessionDriver?.kycStatus || 'approved'}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Star size={12} color={Colors.accent} fill={Colors.accent} />
              <Text style={styles.metaText}>{driver.rating}</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaText}>{driver.trips} trips</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaText}>{driver.years}+ yrs</Text>
            </View>
          </View>
        </View>
      </Card>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{todayTrips}</Text>
          <Text style={styles.statLabel}>Today trips</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>₹{todayEarnings}</Text>
          <Text style={styles.statLabel}>Today earn</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{driver.city}</Text>
          <Text style={styles.statLabel}>City</Text>
        </View>
      </View>

      <Card padded={false}>
        {MENU.map((item, idx) => {
          const Icon = item.icon;
          const value =
            item.label === 'Vehicle details'
              ? driver.vehicle
              : item.label.startsWith('Documents')
                ? driver.vehicleCategory
                : item.value;
          return (
            <Pressable
              key={item.label}
              style={[styles.menuRow, idx < MENU.length - 1 && styles.menuBorder]}
              onPress={() => router.push(item.href)}
            >
              <View style={styles.menuIcon}>
                <Icon size={18} color={Colors.primary} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                {value ? <Text style={styles.menuValue}>{value}</Text> : null}
              </View>
              <ChevronRight size={18} color={Colors.textLight} />
            </Pressable>
          );
        })}
      </Card>

      <Button
        title="Sign out"
        variant="outline"
        onPress={() =>
          Alert.alert('Sign out?', 'You will need admin credentials to log in again.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Sign out',
              style: 'destructive',
              onPress: () => {
                clearSession();
                router.replace('/driver/login');
              },
            },
          ])
        }
        leftIcon={<LogOut size={16} color={Colors.primary} />}
        fullWidth
      />

      <Text style={styles.version}>Raydo Driver · v1.0.0</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 14,
    paddingBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
  },
  profileCard: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '800',
  },
  profileInfo: { flex: 1, gap: 4 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  phone: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    alignItems: 'center',
    ...Shadow.soft,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 4,
    fontWeight: '600',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  menuBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: { flex: 1 },
  menuLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  menuValue: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  version: {
    textAlign: 'center',
    color: Colors.textLight,
    fontSize: 12,
    marginTop: 4,
  },
});
