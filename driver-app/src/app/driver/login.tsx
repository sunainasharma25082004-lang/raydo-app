import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Phone, ShieldCheck, CarFront } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors, Radius, Shadow } from '@/constants/Colors';

export default function DriverLoginScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canContinue =
    step === 'PHONE' ? phone.replace(/\D/g, '').length === 10 : otp.length === 4;

  const handleContinue = () => {
    setError('');
    if (step === 'PHONE') {
      if (phone.replace(/\D/g, '').length !== 10) {
        setError('Enter a valid 10-digit mobile number');
        return;
      }
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setStep('OTP');
      }, 600);
      return;
    }

    if (otp.length !== 4) {
      setError('Enter the 4-digit OTP');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/driver/(tabs)/home');
    }, 700);
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
          <Text style={styles.heroTitle}>Drive with{'\n'}confidence.</Text>
          <Text style={styles.heroSub}>
            Partner app for accepting rides, tracking trips, and managing earnings — demo ready.
          </Text>
        </View>

        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>
            {step === 'PHONE' ? 'Partner login' : 'Verify OTP'}
          </Text>
          <Text style={styles.sheetSub}>
            {step === 'PHONE'
              ? 'Enter your registered mobile number to continue.'
              : `We sent a 4-digit code to +91 ${phone}`}
          </Text>

          {step === 'PHONE' ? (
            <Input
              label="Mobile number"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, ''))}
              placeholder="98765 43210"
              left={
                <View style={styles.prefixWrap}>
                  <Phone size={16} color={Colors.textLight} />
                  <Text style={styles.prefix}>+91</Text>
                </View>
              }
              error={error}
            />
          ) : (
            <Input
              label="One-time password"
              keyboardType="number-pad"
              maxLength={4}
              value={otp}
              onChangeText={(t) => setOtp(t.replace(/\D/g, ''))}
              placeholder="••••"
              left={<ShieldCheck size={18} color={Colors.textLight} />}
              error={error}
              style={{ letterSpacing: 10, fontSize: 22 }}
            />
          )}

          <Button
            title={step === 'PHONE' ? 'Send OTP' : 'Verify & continue'}
            onPress={handleContinue}
            disabled={!canContinue}
            loading={loading}
            fullWidth
            size="lg"
            rightIcon={!loading ? <ArrowRight size={18} color={Colors.white} /> : undefined}
            style={{ marginTop: 8 }}
          />

          {step === 'OTP' ? (
            <Pressable
              onPress={() => {
                setStep('PHONE');
                setOtp('');
                setError('');
              }}
              style={styles.linkBtn}
            >
              <Text style={styles.linkText}>Change phone number</Text>
            </Pressable>
          ) : (
            <Text style={styles.hint}>Demo: use any 10-digit number + any 4-digit OTP</Text>
          )}
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
    maxWidth: 320,
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
  prefixWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 4,
  },
  prefix: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  linkBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  linkText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  hint: {
    textAlign: 'center',
    color: Colors.textLight,
    fontSize: 12,
    marginTop: 4,
  },
});
