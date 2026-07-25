import React from 'react';
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: ('top' | 'bottom')[];
  backgroundColor?: string;
  statusBarStyle?: 'light-content' | 'dark-content';
};

export function Screen({
  children,
  scroll,
  style,
  contentStyle,
  edges = ['top', 'bottom'],
  backgroundColor,
  statusBarStyle,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const bg = backgroundColor ?? colors.background;
  const bar = statusBarStyle ?? (isDark ? 'light-content' : 'dark-content');
  const paddingTop = edges.includes('top') ? insets.top : 0;
  const paddingBottom = edges.includes('bottom') ? Math.max(insets.bottom, 12) : 0;

  if (scroll) {
    return (
      <View style={[styles.root, { backgroundColor: bg, paddingTop }, style]}>
        <StatusBar barStyle={bar} backgroundColor={bg} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: paddingBottom + 16 },
            contentStyle,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: bg, paddingTop, paddingBottom }, style]}>
      <StatusBar barStyle={bar} backgroundColor={bg} />
      <View style={[styles.fill, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
  },
});
