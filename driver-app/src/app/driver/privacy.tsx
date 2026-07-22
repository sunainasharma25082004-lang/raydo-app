import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { PRIVACY_SECTIONS } from '@/constants/legal';
import { Colors } from '@/constants/Colors';

export default function PrivacyScreen() {
  return (
    <Screen scroll contentStyle={styles.content}>
      <ScreenHeader title="Privacy Policy" subtitle="Raydo Mobility Pvt. Ltd." />
      <Text style={styles.intro}>
        How Raydo collects and uses partner data when you drive with the Raydo Driver app.
      </Text>
      {PRIVACY_SECTIONS.map((section) => (
        <Card key={section.heading}>
          <Text style={styles.heading}>{section.heading}</Text>
          {section.paragraphs.map((p) => (
            <Text key={p.slice(0, 28)} style={styles.p}>
              {p}
            </Text>
          ))}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 12, paddingBottom: 32 },
  intro: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textLight,
    fontWeight: '600',
  },
  heading: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 8,
  },
  p: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 6,
  },
});
