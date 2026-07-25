import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Bell, MapPin, Moon, Navigation, Smartphone, Sun, Volume2 } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Radius } from '@/constants/Colors';
import { Href, useRouter } from 'expo-router';
import { useAppTheme, ThemeMode } from '@/context/ThemeContext';

export default function PreferencesScreen() {
  const router = useRouter();
  const { colors, mode, setMode, isDark } = useAppTheme();
  const [rideAlerts, setRideAlerts] = useState(true);
  const [sound, setSound] = useState(true);
  const [navVoice, setNavVoice] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Screen scroll contentStyle={styles.content}>
      <ScreenHeader title="Preferences" subtitle="Trip, theme & notifications" />

      <Text style={styles.section}>Appearance</Text>
      <Card>
        <Text style={styles.hint}>
          Light / Dark / System — changes apply instantly across the app.
        </Text>
        <View style={styles.themeRow}>
          {(
            [
              { key: 'light' as ThemeMode, label: 'Light', Icon: Sun },
              { key: 'dark' as ThemeMode, label: 'Dark', Icon: Moon },
              { key: 'system' as ThemeMode, label: 'System', Icon: Smartphone },
            ] as const
          ).map(({ key, label, Icon }) => {
            const on = mode === key;
            return (
              <Pressable
                key={key}
                onPress={() => setMode(key)}
                style={[styles.chip, on && styles.chipOn]}
              >
                <Icon size={16} color={on ? colors.white : colors.primary} />
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.borderTop}>
          <ToggleRow
            icon={<Moon size={16} color={colors.primary} />}
            title="Dark mode"
            subtitle={
              mode === 'system'
                ? `System · currently ${isDark ? 'dark' : 'light'}`
                : isDark
                  ? 'Dark theme active'
                  : 'Light theme active'
            }
            value={isDark}
            onValueChange={(v) => setMode(v ? 'dark' : 'light')}
            colors={colors}
          />
        </View>
      </Card>

      <Text style={styles.section}>Trip alerts</Text>
      <Card padded={false}>
        <ToggleRow
          icon={<Bell size={16} color={colors.primary} />}
          title="Ride request alerts"
          subtitle="Sound + banner for new jobs"
          value={rideAlerts}
          onValueChange={setRideAlerts}
          colors={colors}
        />
        <ToggleRow
          icon={<Volume2 size={16} color={colors.primary} />}
          title="Alert sound"
          subtitle="Play tone on incoming request"
          value={sound}
          onValueChange={setSound}
          colors={colors}
          border
        />
        <ToggleRow
          icon={<Navigation size={16} color={colors.primary} />}
          title="Navigation voice"
          subtitle="Turn-by-turn prompts in trip"
          value={navVoice}
          onValueChange={setNavVoice}
          colors={colors}
          border
        />
        <ToggleRow
          icon={<MapPin size={16} color={colors.primary} />}
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
          colors={colors}
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
        onPress={() =>
          Alert.alert('Saved', `Theme: ${mode} · ${isDark ? 'Dark' : 'Light'} active`)
        }
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
  colors,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  border?: boolean;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderTopWidth: border ? 1 : 0,
        borderTopColor: colors.border,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: colors.surfaceMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>{title}</Text>
        <Text style={{ fontSize: 12, color: colors.textLight, marginTop: 2, fontWeight: '600' }}>
          {subtitle}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.borderStrong, true: colors.accent }}
        thumbColor={colors.white}
      />
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    content: { paddingHorizontal: 20, gap: 12, paddingBottom: 28 },
    section: {
      marginTop: 4,
      fontSize: 12,
      fontWeight: '800',
      color: colors.textLight,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    hint: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 10,
    },
    themeRow: { flexDirection: 'row', gap: 8 },
    chip: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: Radius.md,
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipOn: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: { fontSize: 12, fontWeight: '800', color: colors.text },
    chipTextOn: { color: colors.white },
    borderTop: { marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  });
}
