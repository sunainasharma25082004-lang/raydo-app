import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { Href, useRouter } from 'expo-router';
import { ArrowRight, KeyRound, CarFront, UserRound } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors, Shadow } from '@/constants/Colors';
import { api } from '@/lib/api';
import { useSession } from '@/context/SessionContext';

export default function DriverLoginScreen() {
  const router = useRouter();
  const { setSession } = useSession();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!loginId.trim() || !password) {
      setError('Enter Driver ID and password from admin');
      return;
    }
    setLoading(true);
    try {
      const res = await api.driverLogin(loginId.trim(), password);
      setSession(res.token, res.driver);
      router.replace('/driver/(tabs)/home' as Href);
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']} backgroundColor={Colors.primary} statusBarStyle="light-content">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.hero}>
          <View style={styles.brandRow}>
            <View style={styles.logoMark}>
              <CarFront color={Colors.primary} size={22} />
            </View>
            <Text style={styles.brand}>Raydo Driver</Text>
          </View>
          <Text style={styles.heroTitle}>Partner{'\n'}login</Text>
          <Text style={styles.heroSub}>
            Login only after admin approves your KYC. Use the Driver ID & password shared by admin.
          </Text>
        </View>

        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Credentials login</Text>
          <Text style={styles.sheetSub}>
            Not OTP — admin-issued ID & password after DL / vehicle verification.
          </Text>

          <Input
            label="Driver ID"
            value={loginId}
            onChangeText={(t) => setLoginId(t.toUpperCase())}
            placeholder="RAYD1001"
            autoCapitalize="characters"
            left={<UserRound size={18} color={Colors.textLight} />}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            left={<KeyRound size={18} color={Colors.textLight} />}
            error={error}
          />

          <Button
            title="Login"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            size="lg"
            rightIcon={!loading ? <ArrowRight size={18} color={Colors.white} /> : undefined}
            style={{ marginTop: 8 }}
          />

          <Pressable onPress={() => router.push('/driver/kyc-apply' as Href)} style={styles.linkBtn}>
            <Text style={styles.linkText}>New partner? Apply for KYC</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/driver/kyc-status' as Href)} style={styles.linkBtn}>
            <Text style={styles.linkMuted}>Check KYC approval status</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
    gap: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  heroTitle: {
    color: Colors.white,
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 42,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 340,
  },
  sheet: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 14,
    ...Shadow.floating,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  sheetSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  linkBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  linkMuted: {
    color: Colors.textLight,
    fontWeight: '600',
    fontSize: 13,
  },
});
