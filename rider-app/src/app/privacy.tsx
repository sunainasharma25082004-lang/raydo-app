import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '@/constants/Colors';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { PRIVACY_SECTIONS } from '@/constants/legal';

export default function PrivacyScreen() {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Privacy Policy" subtitle="Raydo Mobility Pvt. Ltd." />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          This policy explains how Raydo collects, uses, and protects your information when you use
          our rider app.
        </Text>
        {PRIVACY_SECTIONS.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.heading}>{section.heading}</Text>
            {section.paragraphs.map((p) => (
              <Text key={p.slice(0, 32)} style={styles.paragraph}>
                {p}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, paddingBottom: 48 },
  intro: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textLight,
    marginBottom: 20,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.text,
    marginBottom: 8,
  },
});
