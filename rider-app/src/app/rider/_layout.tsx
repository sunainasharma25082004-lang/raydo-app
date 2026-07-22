import { Stack } from 'expo-router';

/**
 * Rider booking flow stack.
 * Note: main Home lives at /(tabs)/home — not inside this folder.
 */
export default function RiderLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="search" />
      <Stack.Screen name="vehicle" />
      <Stack.Screen name="tracking" />
      <Stack.Screen name="payment" />
    </Stack>
  );
}
