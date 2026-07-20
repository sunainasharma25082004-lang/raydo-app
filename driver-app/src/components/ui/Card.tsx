import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors, Radius, Shadow } from '@/constants/Colors';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  elevated?: boolean;
};

export function Card({ children, style, padded = true, elevated = true }: Props) {
  return (
    <View
      style={[
        styles.card,
        padded && styles.padded,
        elevated && Shadow.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  padded: {
    padding: 16,
  },
});
