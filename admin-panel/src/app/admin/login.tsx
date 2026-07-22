import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { adminApi } from '@/lib/api';

// Simple in-memory token for admin session (web refresh loses it — fine for demo)
export let ADMIN_TOKEN = '';

export function setAdminToken(t: string) {
  ADMIN_TOKEN = t;
}

export default function AdminLoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.login(username.trim(), password);
      setAdminToken(res.token);
      router.replace('/admin/dashboard');
    } catch (e: any) {
      setError(e.message || 'Login failed. Start backend on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Raydo Admin</Text>
        <Text style={styles.sub}>Approve driver KYC · issue login credentials</Text>

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          placeholder="admin"
          placeholderTextColor={Colors.textLight}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={Colors.textLight}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.btn} onPress={onLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Login</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>Default: admin / admin123</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  title: { fontSize: 26, fontWeight: '800', color: Colors.primary },
  sub: { fontSize: 14, color: Colors.textLight, marginTop: 6, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textLight, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E8EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 14,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error: { color: Colors.error, marginBottom: 8, fontWeight: '600' },
  hint: { textAlign: 'center', marginTop: 14, color: Colors.textLight, fontSize: 12 },
});
