import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Radius } from '@/constants/Colors';
import { Home, Clock, User } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useMemo } from 'react';

function TabIcon({
  icon: Icon,
  color,
  focused,
  activeBg,
}: {
  icon: typeof Home;
  color: string;
  focused: boolean;
  activeBg: string;
}) {
  return (
    <View
      style={[
        styles.iconWrap,
        focused && { backgroundColor: activeBg },
      ]}
    >
      <Icon color={color as string} size={22} strokeWidth={focused ? 2.4 : 2} />
    </View>
  );
}

export default function TabLayout() {
  const { colors, shadow, isDark } = useAppTheme();
  const tabBarStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.surface,
      borderTopWidth: isDark ? 1 : 0,
      borderTopColor: colors.border,
      height: Platform.OS === 'ios' ? 84 : 68,
      paddingBottom: Platform.OS === 'ios' ? 24 : 10,
      paddingTop: 8,
      ...shadow.floating,
      elevation: 12,
      zIndex: 20,
    }),
    [colors, shadow, isDark],
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
          marginTop: 2,
        },
        tabBarStyle,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={Home}
              color={String(color)}
              focused={focused}
              activeBg={colors.accentSoft}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Rides',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={Clock}
              color={String(color)}
              focused={focused}
              activeBg={colors.accentSoft}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={User}
              color={String(color)}
              focused={focused}
              activeBg={colors.accentSoft}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 40,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
});
