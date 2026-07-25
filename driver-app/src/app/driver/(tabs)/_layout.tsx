import { Tabs } from 'expo-router';
import { History, Home, IndianRupee, UserRound } from 'lucide-react-native';
import { Platform } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useMemo } from 'react';

export default function DriverTabsLayout() {
  const { colors, isDark } = useAppTheme();
  const tabBarStyle = useMemo(
    () => ({
      height: Platform.OS === 'ios' ? 88 : 68,
      paddingTop: 8,
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
      borderTopWidth: 1,
    }),
    [colors, isDark],
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginBottom: Platform.OS === 'ios' ? 0 : 6,
        },
        tabBarStyle,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ color, size }) => <IndianRupee color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color, size }) => <History color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
