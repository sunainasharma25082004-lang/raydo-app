import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { ThemeProvider, useAppTheme } from '@/context/ThemeContext';
import {
  registerRiderNotificationTapHandler,
  setupRiderNotifications,
} from '@/lib/notifications';

function RootNav() {
  const { isDark, colors } = useAppTheme();
  const router = useRouter();

  useEffect(() => {
    setupRiderNotifications();
    const unsub = registerRiderNotificationTapHandler(router);
    return () => {
      unsub?.();
    };
  }, [router]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <RootNav />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
