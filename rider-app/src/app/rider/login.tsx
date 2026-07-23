import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Shadow } from '@/constants/Colors';
import { ArrowRight, Phone, ShieldCheck, Sparkles } from 'lucide-react-native';
import { saveRiderLogin } from '@/lib/session';
import { askLocationPermission } from '@/hooks/use-current-location';

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [submitting, setSubmitting] = useState(false);

  const canContinue =
    step === 'PHONE' ? phone.replace(/\D/g, '').length === 10 : otp.length === 4;

  const handleNext = async () => {
    if (step === 'PHONE' && canContinue) {
      setStep('OTP');
      return;
    }
    if (step === 'OTP' && canContinue && !submitting) {
      setSubmitting(true);
      try {
        // 1) Save session first — if app restarts, user returns to home
        await saveRiderLogin(phone);

        // 2) Ask location HERE (login screen — no MapView).
        //    Asking on home while MapView mounts is what kills the app on MIUI.
        try {
          await askLocationPermission();
        } catch {
          /* optional — home still works without GPS */
        }

        // 3) Let Android finish permission Activity before we mount the map
        await wait(450);

        router.replace('/(tabs)/home');
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.hero}>
          <View style={styles.brandRow}>
            <View style={styles.logoMark}>
              <Text style={styles.logoLetter}>R</Text>
            </View>
            <Text style={styles.brand}>Raydo</Text>
          </View>
          <Text style={styles.heroTitle}>
            Ride with{'\n'}calm confidence.
          </Text>
          <Text style={styles.heroSub}>
            Premium local rides — fair fares, live tracking, and verified partners.
          </Text>
          <View style={styles.heroChip}>
            <Sparkles size={14} color={Colors.accent} />
            <Text style={styles.heroChipText}>Bengaluru · Safe · On-time</Text>
          </View>
        </View>

        <View style={styles.sheet}>
          <Text style={styles.title}>
            {step === 'PHONE' ? 'Welcome back' : 'Enter OTP'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'PHONE'
              ? 'Use your mobile number to continue booking rides.'
              : `We sent a 4-digit code to +91 ${phone}`}
          </Text>

          <View style={styles.inputContainer}>
            {step === 'PHONE' ? (
              <>
                <Phone color={Colors.textLight} size={18} />
                <Text style={styles.prefix}>+91</Text>
                <TextInput
                  style={styles.input}
                  placeholder="98765 43210"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  autoFocus
                />
              </>
            ) : (
              <>
                <ShieldCheck color={Colors.textLight} size={18} />
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="••••"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  autoFocus
                />
              </>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              canContinue && !submitting ? styles.buttonActive : styles.buttonDisabled,
            ]}
            onPress={handleNext}
            disabled={!canContinue || submitting}
            activeOpacity={0.9}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.accent} />
            ) : (
              <>
                <Text style={styles.buttonText}>
                  {step === 'PHONE' ? 'Send OTP' : 'Verify & continue'}
                </Text>
                <ArrowRight color={canContinue ? Colors.accent : Colors.textLight} size={18} />
              </>
            )}
          </TouchableOpacity>

          {step === 'OTP' ? (
            <TouchableOpacity
              onPress={() => {
                setStep('PHONE');
                setOtp('');
              }}
              style={styles.linkBtn}
            >
              <Text style={styles.linkText}>Change number</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.hint}>Demo: any 10-digit number + any 4-digit OTP</Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  flex: { flex: 1 },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 20,
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
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    color: Colors.primary,
    fontWeight: '900',
    fontSize: 18,
  },
  brand: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  heroTitle: {
    color: Colors.white,
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 320,
  },
  heroChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    marginTop: 4,
  },
  heroChipText: {
    color: Colors.accent,
    fontWeight: '700',
    fontSize: 12,
  },
  sheet: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 12,
    ...Shadow.floating,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    minHeight: 56,
    gap: 8,
  },
  prefix: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    paddingVertical: 14,
  },
  otpInput: {
    letterSpacing: 12,
    fontSize: 24,
    fontWeight: '800',
  },
  button: {
    marginTop: 8,
    borderRadius: Radius.lg,
    minHeight: 56,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonActive: {
    backgroundColor: Colors.primary,
  },
  buttonDisabled: {
    backgroundColor: Colors.surfaceMuted,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
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
