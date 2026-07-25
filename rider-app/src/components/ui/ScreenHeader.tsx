import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { Radius } from '@/constants/Colors';
import { useAppTheme } from '@/context/ThemeContext';

type Props = {
  title: string;
  subtitle?: string;
};

export function ScreenHeader({ title, subtitle }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingBottom: 14,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        backBtn: {
          width: 42,
          height: 42,
          borderRadius: Radius.md,
          backgroundColor: colors.surfaceMuted,
          alignItems: 'center',
          justifyContent: 'center',
        },
        titles: { flex: 1, marginHorizontal: 12 },
        title: {
          fontSize: 18,
          fontWeight: '800',
          color: colors.text,
        },
        subtitle: {
          fontSize: 12,
          color: colors.textLight,
          marginTop: 2,
          fontWeight: '600',
        },
        spacer: { width: 42 },
      }),
    [colors],
  );

  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))}
        hitSlop={12}
      >
        <ChevronLeft color={colors.primary} size={22} />
      </TouchableOpacity>
      <View style={styles.titles}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.spacer} />
    </View>
  );
}
