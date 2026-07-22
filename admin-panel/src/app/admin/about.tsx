import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, ArrowLeft } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';

const DEVELOPERS = [
  { name: 'Sunaina Sharma', role: 'Developer' },
  { name: 'Divyanshu Chauhan', role: 'Developer' },
];

export default function AdminAboutScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
          <ArrowLeft color={Colors.white} size={18} />
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>About Raydo Admin</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.logo}>
            <Shield color={Colors.accent} size={28} />
          </View>
          <Text style={styles.brand}>Raydo</Text>
          <Text style={styles.tag}>
            Control panel for KYC, rider safety (block), ride analytics, reviews & weekly payouts.
          </Text>
        </View>

        <Text style={styles.section}>Capabilities</Text>
        {[
          'Approve / reject driver KYC & issue login IDs',
          'View each rider’s total rides',
          'Good vs bad review breakdown per rider',
          'Block / unblock riders from booking',
          'Weekly driver withdrawal window & payouts',
        ].map((line) => (
          <View key={line} style={styles.bulletRow}>
            <View style={styles.dot} />
            <Text style={styles.bullet}>{line}</Text>
          </View>
        ))}

        <Text style={[styles.section, { marginTop: 20 }]}>Developers</Text>
        {DEVELOPERS.map((d) => (
          <View key={d.name} style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.initials}>
                {d.name
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)}
              </Text>
            </View>
            <View>
              <Text style={styles.name}>{d.name}</Text>
              <Text style={styles.role}>{d.role}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.footer}>Raydo Mobility · Admin v1.1</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: Platform.OS === 'web' ? 24 : 50,
    paddingHorizontal: 20,
    paddingBottom: 22,
    backgroundColor: Colors.primary,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  back: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.white, letterSpacing: 0.2 },
  content: { padding: 22, paddingBottom: 40 },
  heroCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EFEBE3',
    alignItems: 'flex-start',
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brand: { fontSize: 26, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },
  tag: { fontSize: 14, color: Colors.textLight, marginTop: 8, lineHeight: 20, fontWeight: '500' },
  section: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  bulletRow: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    marginTop: 5,
  },
  bullet: { flex: 1, fontSize: 14, color: Colors.text, fontWeight: '600', lineHeight: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EFEBE3',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: Colors.accent, fontWeight: '800' },
  name: { fontSize: 16, fontWeight: '700', color: Colors.text },
  role: { fontSize: 13, color: Colors.textLight, marginTop: 2, fontWeight: '600' },
  footer: { textAlign: 'center', marginTop: 28, color: Colors.textLight, fontSize: 12, fontWeight: '600' },
});
