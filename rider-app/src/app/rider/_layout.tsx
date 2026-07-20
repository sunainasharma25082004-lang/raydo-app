import { Stack } from 'expo-router';

export default function RiderLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="home" />
      <Stack.Screen name="search" />
      <Stack.Screen name="vehicle" />
      <Stack.Screen name="tracking" />
      <Stack.Screen name="payment" />
    </Stack>
  );
}
