import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Colors, Radius } from '@/constants/Colors';

type Props = TextInputProps & {
  label?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  error?: string;
};

export function Input({ label, left, right, error, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.field, error ? styles.fieldError : null]}>
        {left ? <View style={styles.side}>{left}</View> : null}
        <TextInput
          placeholderTextColor={Colors.textLight}
          style={[styles.input, style]}
          {...rest}
        />
        {right ? <View style={styles.side}>{right}</View> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', gap: 8 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    minHeight: 54,
  },
  fieldError: {
    borderColor: Colors.error,
  },
  side: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    paddingVertical: 12,
  },
  error: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '500',
  },
});
