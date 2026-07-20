import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function DriverLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="request"
        options={{
          presentation: 'transparentModal',
          animation: 'fade',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen name="trip" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}
