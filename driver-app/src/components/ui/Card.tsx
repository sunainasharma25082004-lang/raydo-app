import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Radius } from '@/constants/Colors';
import { useAppTheme } from '@/context/ThemeContext';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  elevated?: boolean;
};

export function Card({ children, style, padded = true, elevated = true }: Props) {
  const { colors, shadow } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surface,
          borderRadius: Radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
        },
        padded: { padding: 16 },
      }),
    [colors],
  );

  return (
    <View style={[styles.card, padded && styles.padded, elevated && shadow.card, style]}>
      {children}
    </View>
  );
}
