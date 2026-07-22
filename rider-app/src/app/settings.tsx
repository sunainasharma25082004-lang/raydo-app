import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Colors } from '@/constants/Colors';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Bell, MapPin, Moon, Globe, Shield } from 'lucide-react-native';
import { Href, useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  const [rideUpdates, setRideUpdates] = useState(true);
  const [promos, setPromos] = useState(false);
  const [shareLocation, setShareLocation] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Settings" subtitle="Preferences for your rides" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>Notifications</Text>
        <View style={styles.card}>
          <ToggleRow
            icon={<Bell color={Colors.primary} size={18} />}
            title="Ride updates"
            subtitle="Driver assigned, arrival, trip end"
            value={rideUpdates}
            onValueChange={setRideUpdates}
          />
          <View style={styles.divider} />
          <ToggleRow
            icon={<Bell color={Colors.primary} size={18} />}
            title="Offers & promos"
            subtitle="Discounts and city campaigns"
            value={promos}
            onValueChange={setPromos}
          />
        </View>

        <Text style={styles.section}>Privacy & app</Text>
        <View style={styles.card}>
          <ToggleRow
            icon={<MapPin color={Colors.primary} size={18} />}
            title="Share live location"
            subtitle="During active trips only"
            value={shareLocation}
            onValueChange={setShareLocation}
          />
          <View style={styles.divider} />
          <ToggleRow
            icon={<Moon color={Colors.primary} size={18} />}
            title="Dark mode"
            subtitle="Coming soon · preview toggle"
            value={darkMode}
            onValueChange={(v) => {
              setDarkMode(v);
              if (v) Alert.alert('Dark mode', 'Full dark theme ships in a future update.');
            }}
          />
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Alert.alert('Language', 'English (India) is the default for now.')}
          >
            <View style={styles.iconBg}>
              <Globe color={Colors.primary} size={18} />
            </View>
            <View style={styles.linkText}>
              <Text style={styles.rowTitle}>Language</Text>
              <Text style={styles.rowSub}>English (India)</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/privacy' as Href)}>
            <View style={styles.iconBg}>
              <Shield color={Colors.primary} size={18} />
            </View>
            <View style={styles.linkText}>
              <Text style={styles.rowTitle}>Privacy Policy</Text>
              <Text style={styles.rowSub}>How we handle your data</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() => Alert.alert('Settings saved', 'Your preferences have been updated.')}
        >
          <Text style={styles.saveText}>Save preferences</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.iconBg}>{icon}</View>
      <View style={styles.linkText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#D1D5DB', true: Colors.accent }}
        thumbColor={Colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, paddingBottom: 40 },
  section: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textLight,
    marginBottom: 10,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  linkText: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  rowSub: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F3F4F6' },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
