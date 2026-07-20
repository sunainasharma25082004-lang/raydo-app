import { Tabs } from 'expo-router';
import { History, Home, IndianRupee, UserRound } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Platform } from 'react-native';

export default function DriverTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginBottom: Platform.OS === 'ios' ? 0 : 6,
        },
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 8,
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
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
