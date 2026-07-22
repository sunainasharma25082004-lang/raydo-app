import React from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ABOUT_US } from '@/constants/legal';
import { Colors, Radius } from '@/constants/Colors';

export default function AboutScreen() {
  return (
    <Screen scroll contentStyle={styles.content}>
      <ScreenHeader title="About Us" subtitle={ABOUT_US.company} />

      <Card style={styles.hero}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>R</Text>
        </View>
        <Text style={styles.brand}>Raydo Driver</Text>
        <Text style={styles.tagline}>{ABOUT_US.tagline}</Text>
        <Text style={styles.version}>v{ABOUT_US.version}</Text>
      </Card>

      <Card>
        {ABOUT_US.body.map((p) => (
          <Text key={p.slice(0, 20)} style={styles.p}>
            {p}
          </Text>
        ))}
      </Card>

      <Card>
        <Text style={styles.devTitle}>Developers</Text>
        {ABOUT_US.developers.map((dev) => (
          <View key={dev.name} style={styles.devRow}>
            <View style={styles.devAvatar}>
              <Text style={styles.devInitials}>
                {dev.name
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)}
              </Text>
            </View>
            <View>
              <Text style={styles.devName}>{dev.name}</Text>
              <Text style={styles.devRole}>{dev.role}</Text>
            </View>
          </View>
        ))}
      </Card>

      {ABOUT_US.highlights.map((h) => (
        <Card key={h.label} style={styles.stat}>
          <Text style={styles.statValue}>{h.value}</Text>
          <Text style={styles.statLabel}>{h.label}</Text>
        </Card>
      ))}

      <Button
        title={`Contact ${ABOUT_US.email}`}
        fullWidth
        onPress={() =>
          Linking.openURL(`mailto:${ABOUT_US.email}`).catch(() =>
            Alert.alert('Email', ABOUT_US.email),
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 12, paddingBottom: 28 },
  hero: { alignItems: 'center', gap: 6, paddingVertical: 22 },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoText: { color: Colors.accent, fontSize: 28, fontWeight: '800' },
  brand: { fontSize: 22, fontWeight: '800', color: Colors.text },
  tagline: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  version: { fontSize: 12, color: Colors.textLight, marginTop: 4, fontWeight: '600' },
  p: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 10,
  },
  devTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 12,
  },
  devRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  devAvatar: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devInitials: { color: Colors.accent, fontWeight: '800', fontSize: 13 },
  devName: { fontSize: 15, fontWeight: '800', color: Colors.text },
  devRole: { fontSize: 12, color: Colors.textLight, marginTop: 2, fontWeight: '600' },
  stat: { borderRadius: Radius.md },
  statValue: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 12, color: Colors.textLight, marginTop: 2, fontWeight: '600' },
});
