import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
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
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>About Raydo Admin</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.brand}>Raydo</Text>
        <Text style={styles.tag}>Production control panel for KYC, live rides & payouts.</Text>

        <Text style={styles.section}>Developers</Text>
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

        <Text style={styles.footer}>Raydo Mobility · v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E8EB',
  },
  back: { color: Colors.primary, fontWeight: '700', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  content: { padding: 20 },
  brand: { fontSize: 28, fontWeight: '800', color: Colors.primary },
  tag: { fontSize: 14, color: Colors.textLight, marginTop: 6, marginBottom: 24 },
  section: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textLight,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: Colors.accent, fontWeight: '800' },
  name: { fontSize: 16, fontWeight: '700', color: Colors.text },
  role: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
  footer: { textAlign: 'center', marginTop: 24, color: Colors.textLight, fontSize: 12 },
});
