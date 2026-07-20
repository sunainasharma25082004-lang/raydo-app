import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radius } from '@/constants/Colors';

type Props = {
  label: string;
  value: string;
  icon?: React.ReactNode;
  tone?: 'default' | 'accent' | 'success';
};

export function StatPill({ label, value, icon, tone = 'default' }: Props) {
  return (
    <View style={[styles.wrap, toneStyles[tone]]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'flex-start',
    gap: 4,
  },
  icon: {
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  label: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '600',
  },
});

const toneStyles = StyleSheet.create({
  default: {},
  accent: {
    backgroundColor: Colors.accentSoft,
    borderColor: '#E8D7B0',
  },
  success: {
    backgroundColor: Colors.successSoft,
    borderColor: '#B7E4C7',
  },
});
