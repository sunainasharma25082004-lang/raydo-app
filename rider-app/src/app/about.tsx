import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '@/constants/Colors';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ABOUT_US } from '@/constants/legal';

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <ScreenHeader title="About Us" subtitle={ABOUT_US.company} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>R</Text>
          </View>
          <Text style={styles.brand}>Raydo</Text>
          <Text style={styles.tagline}>{ABOUT_US.tagline}</Text>
          <Text style={styles.version}>Version {ABOUT_US.version}</Text>
        </View>

        <View style={styles.card}>
          {ABOUT_US.body.map((p) => (
            <Text key={p.slice(0, 24)} style={styles.paragraph}>
              {p}
            </Text>
          ))}
        </View>

        <View style={styles.card}>
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
        </View>

        <View style={styles.stats}>
          {ABOUT_US.highlights.map((h) => (
            <View key={h.label} style={styles.statBox}>
              <Text style={styles.statValue}>{h.value}</Text>
              <Text style={styles.statLabel}>{h.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.emailBtn}
          onPress={() =>
            Linking.openURL(`mailto:${ABOUT_US.email}`).catch(() =>
              Alert.alert('Email us', ABOUT_US.email),
            )
          }
        >
          <Text style={styles.emailText}>Contact {ABOUT_US.email}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, paddingBottom: 40 },
  hero: { alignItems: 'center', marginBottom: 24 },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: { color: Colors.accent, fontSize: 32, fontWeight: '800' },
  brand: { fontSize: 28, fontWeight: '800', color: Colors.primary },
  tagline: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
  version: { marginTop: 8, fontSize: 12, color: Colors.textLight },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textSecondary,
    marginBottom: 12,
    fontWeight: '500',
  },
  devTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 14,
  },
  devRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  devAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devInitials: { color: Colors.accent, fontWeight: '800', fontSize: 14 },
  devName: { fontSize: 16, fontWeight: '800', color: Colors.text },
  devRole: { fontSize: 13, color: Colors.textLight, marginTop: 2, fontWeight: '600' },
  stats: { gap: 10, marginBottom: 20 },
  statBox: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 12, color: Colors.textLight, marginTop: 2, fontWeight: '600' },
  emailBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  emailText: { color: Colors.white, fontWeight: '800', fontSize: 15 },
});
