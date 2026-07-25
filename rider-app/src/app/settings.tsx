import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Bell, MapPin, Moon, Globe, Shield, Sun, Smartphone } from 'lucide-react-native';
import { Href, useRouter } from 'expo-router';
import { Radius } from '@/constants/Colors';
import { useAppTheme, ThemeMode } from '@/context/ThemeContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, mode, setMode, isDark } = useAppTheme();
  const [rideUpdates, setRideUpdates] = useState(true);
  const [promos, setPromos] = useState(false);
  const [shareLocation, setShareLocation] = useState(true);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const selectTheme = (m: ThemeMode) => {
    setMode(m);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Settings" subtitle="Preferences for your rides" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>Appearance</Text>
        <View style={styles.card}>
          <Text style={styles.appearanceHint}>
            Choose light, dark, or follow your phone system setting.
          </Text>
          <View style={styles.themeRow}>
            <ThemeChip
              active={mode === 'light'}
              label="Light"
              icon={<Sun size={16} color={mode === 'light' ? colors.white : colors.primary} />}
              onPress={() => selectTheme('light')}
              colors={colors}
            />
            <ThemeChip
              active={mode === 'dark'}
              label="Dark"
              icon={<Moon size={16} color={mode === 'dark' ? colors.white : colors.primary} />}
              onPress={() => selectTheme('dark')}
              colors={colors}
            />
            <ThemeChip
              active={mode === 'system'}
              label="System"
              icon={
                <Smartphone
                  size={16}
                  color={mode === 'system' ? colors.white : colors.primary}
                />
              }
              onPress={() => selectTheme('system')}
              colors={colors}
            />
          </View>
          <View style={styles.divider} />
          <ToggleRow
            icon={<Moon color={colors.primary} size={18} />}
            title="Dark mode"
            subtitle={
              mode === 'system'
                ? `Following system · now ${isDark ? 'dark' : 'light'}`
                : isDark
                  ? 'Dark theme on'
                  : 'Light theme on'
            }
            value={isDark}
            onValueChange={(v) => setMode(v ? 'dark' : 'light')}
            colors={colors}
          />
        </View>

        <Text style={styles.section}>Notifications</Text>
        <View style={styles.card}>
          <ToggleRow
            icon={<Bell color={colors.primary} size={18} />}
            title="Ride updates"
            subtitle="Driver assigned, arrival, trip end"
            value={rideUpdates}
            onValueChange={setRideUpdates}
            colors={colors}
          />
          <View style={styles.divider} />
          <ToggleRow
            icon={<Bell color={colors.primary} size={18} />}
            title="Offers & promos"
            subtitle="Discounts and city campaigns"
            value={promos}
            onValueChange={setPromos}
            colors={colors}
          />
        </View>

        <Text style={styles.section}>Privacy & app</Text>
        <View style={styles.card}>
          <ToggleRow
            icon={<MapPin color={colors.primary} size={18} />}
            title="Share live location"
            subtitle="During active trips only"
            value={shareLocation}
            onValueChange={setShareLocation}
            colors={colors}
          />
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Alert.alert('Language', 'English (India) is the default for now.')}
          >
            <View style={styles.iconBg}>
              <Globe color={colors.primary} size={18} />
            </View>
            <View style={styles.linkText}>
              <Text style={styles.rowTitle}>Language</Text>
              <Text style={styles.rowSub}>English (India)</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/privacy' as Href)}>
            <View style={styles.iconBg}>
              <Shield color={colors.primary} size={18} />
            </View>
            <View style={styles.linkText}>
              <Text style={styles.rowTitle}>Privacy Policy</Text>
              <Text style={styles.rowSub}>How we handle your data</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() =>
            Alert.alert('Settings saved', `Theme: ${mode}${isDark ? ' (dark)' : ' (light)'}`)
          }
        >
          <Text style={styles.saveText}>Save preferences</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function ThemeChip({
  active,
  label,
  icon,
  onPress,
  colors,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        alignItems: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: Radius.md,
        backgroundColor: active ? colors.primary : colors.surfaceMuted,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
      }}
    >
      {icon}
      <Text
        style={{
          fontSize: 12,
          fontWeight: '800',
          color: active ? colors.white : colors.text,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  colors,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: colors.surfaceMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{title}</Text>
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textLight, marginTop: 2 }}>
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
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 40, gap: 8 },
    section: {
      marginTop: 12,
      marginBottom: 8,
      fontSize: 12,
      fontWeight: '800',
      color: colors.textLight,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: 4,
    },
    appearanceHint: {
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 4,
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    themeRow: {
      flexDirection: 'row',
      gap: 8,
      padding: 14,
      paddingTop: 10,
    },
    divider: { height: 1, backgroundColor: colors.border, marginLeft: 66 },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      gap: 12,
    },
    iconBg: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    linkText: { flex: 1 },
    rowTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
    rowSub: { fontSize: 12, fontWeight: '600', color: colors.textLight, marginTop: 2 },
    saveBtn: {
      marginTop: 20,
      backgroundColor: colors.primary,
      borderRadius: Radius.md,
      paddingVertical: 16,
      alignItems: 'center',
    },
    saveText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  });
}
