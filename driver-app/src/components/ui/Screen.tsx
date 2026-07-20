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
import { Colors } from '@/constants/Colors';

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
  backgroundColor = Colors.background,
  statusBarStyle = 'dark-content',
}: Props) {
  const insets = useSafeAreaInsets();
  const paddingTop = edges.includes('top') ? insets.top : 0;
  const paddingBottom = edges.includes('bottom') ? Math.max(insets.bottom, 12) : 0;

  if (scroll) {
    return (
      <View style={[styles.root, { backgroundColor, paddingTop }, style]}>
        <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />
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
    <View
      style={[
        styles.root,
        { backgroundColor, paddingTop, paddingBottom },
        style,
      ]}
    >
      <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />
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
