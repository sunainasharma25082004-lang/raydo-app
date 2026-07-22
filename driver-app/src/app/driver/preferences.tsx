import React, { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { Bell, MapPin, Navigation, Volume2 } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Radius } from '@/constants/Colors';
import { Href, useRouter } from 'expo-router';

export default function PreferencesScreen() {
  const router = useRouter();
  const [rideAlerts, setRideAlerts] = useState(true);
  const [sound, setSound] = useState(true);
  const [navVoice, setNavVoice] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);

  return (
    <Screen scroll contentStyle={styles.content}>
      <ScreenHeader title="Preferences" subtitle="Trip & notification settings" />

      <Card padded={false}>
        <ToggleRow
          icon={<Bell size={16} color={Colors.primary} />}
          title="Ride request alerts"
          subtitle="Sound + banner for new jobs"
          value={rideAlerts}
          onValueChange={setRideAlerts}
        />
        <ToggleRow
          icon={<Volume2 size={16} color={Colors.primary} />}
          title="Alert sound"
          subtitle="Play tone on incoming request"
          value={sound}
          onValueChange={setSound}
          border
        />
        <ToggleRow
          icon={<Navigation size={16} color={Colors.primary} />}
          title="Navigation voice"
          subtitle="Turn-by-turn prompts in trip"
          value={navVoice}
          onValueChange={setNavVoice}
          border
        />
        <ToggleRow
          icon={<MapPin size={16} color={Colors.primary} />}
          title="Auto-accept nearby"
          subtitle="Demo only · off by default"
          value={autoAccept}
          onValueChange={(v) => {
            setAutoAccept(v);
            if (v) {
              Alert.alert(
                'Auto-accept',
                'When enabled in production, low-distance jobs may auto-accept after a short delay.',
              );
            }
          }}
          border
        />
      </Card>

      <Button
        title="Open Privacy Policy"
        variant="outline"
        fullWidth
        onPress={() => router.push('/driver/privacy' as Href)}
      />

      <Button
        title="Save preferences"
        fullWidth
        onPress={() => Alert.alert('Saved', 'Your driver preferences have been updated.')}
      />
    </Screen>
  );
}

function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  border,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  border?: boolean;
}) {
  return (
    <View style={[styles.row, border && styles.borderTop]}>
      <View style={styles.icon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.borderStrong, true: Colors.accent }}
        thumbColor={Colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 14, paddingBottom: 28 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  borderTop: { borderTopWidth: 1, borderTopColor: Colors.border },
  icon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 15, fontWeight: '700', color: Colors.text },
  sub: { fontSize: 12, color: Colors.textLight, marginTop: 2, fontWeight: '600' },
});
