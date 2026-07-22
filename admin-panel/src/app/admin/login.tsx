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
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, Lock, User } from 'lucide-react-native';
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
    <View style={styles.root}>
      <View style={styles.hero}>
        <View style={styles.logoRing}>
          <Shield color={Colors.accent} size={36} strokeWidth={2.2} />
        </View>
        <Text style={styles.brand}>RAYDO</Text>
        <Text style={styles.brandSub}>Admin Control Center</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.sub}>Sign in to manage KYC, riders & payouts</Text>

            <Text style={styles.label}>Username</Text>
            <View style={styles.inputWrap}>
              <User color={Colors.textLight} size={18} />
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="admin"
                placeholderTextColor={Colors.textLight}
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Lock color={Colors.textLight} size={18} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={Colors.textLight}
              />
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.error}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={onLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Sign in to dashboard</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.hint}>Demo · admin / admin123</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primary },
  flex: { flex: 1 },
  hero: {
    paddingTop: Platform.OS === 'web' ? 56 : 64,
    paddingBottom: 36,
    alignItems: 'center',
  },
  logoRing: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: 'rgba(201,162,93,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(201,162,93,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  brand: {
    fontSize: 30,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 5,
  },
  brandSub: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(255,255,255,0.62)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingBottom: 48,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    paddingVertical: 28,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, letterSpacing: -0.2 },
  sub: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
    marginBottom: 26,
    lineHeight: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textLight,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#E8E4DC',
    backgroundColor: '#FAF8F4',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  errorBox: {
    backgroundColor: '#FDECEA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  error: { color: Colors.error, fontWeight: '700', fontSize: 13 },
  hint: {
    textAlign: 'center',
    marginTop: 16,
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '600',
  },
});
