import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function DriverLoginScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Partner Login</Text>
      <TouchableOpacity 
        style={styles.button}
        onPress={() => router.replace('/driver/dashboard')}
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.primary, marginBottom: 20 },
  button: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12 },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' }
});
