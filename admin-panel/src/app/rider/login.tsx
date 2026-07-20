import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { ArrowRight, Phone, ShieldCheck } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');

  const handleNext = () => {
    if (step === 'PHONE' && phone.length >= 10) {
      setStep('OTP');
    } else if (step === 'OTP' && otp.length === 4) {
      // Mock login success
      router.replace('/rider/home');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>
          {step === 'PHONE' ? 'Enter your mobile number' : 'Verify your number'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'PHONE' 
            ? 'We will send you an OTP to verify your account.' 
            : `We've sent a 4-digit code to +91 ${phone}`}
        </Text>

        <View style={styles.inputContainer}>
          {step === 'PHONE' ? (
            <>
              <Phone color={Colors.textLight} size={20} style={styles.icon} />
              <Text style={styles.prefix}>+91</Text>
              <TextInput
                style={styles.input}
                placeholder="00000 00000"
                placeholderTextColor={Colors.textLight}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={10}
                autoFocus
              />
            </>
          ) : (
            <>
              <ShieldCheck color={Colors.textLight} size={20} style={styles.icon} />
              <TextInput
                style={[styles.input, { letterSpacing: 8, fontSize: 24 }]}
                placeholder="0000"
                placeholderTextColor={Colors.textLight}
                keyboardType="number-pad"
                value={otp}
                onChangeText={setOtp}
                maxLength={4}
                autoFocus
              />
            </>
          )}
        </View>

        <TouchableOpacity 
          style={[
            styles.button, 
            ((step === 'PHONE' && phone.length >= 10) || (step === 'OTP' && otp.length === 4)) 
              ? styles.buttonActive 
              : styles.buttonDisabled
          ]}
          onPress={handleNext}
          disabled={(step === 'PHONE' && phone.length < 10) || (step === 'OTP' && otp.length < 4)}
        >
          <Text style={styles.buttonText}>Continue</Text>
          <ArrowRight color={Colors.background} size={20} />
        </TouchableOpacity>

        {step === 'OTP' && (
          <TouchableOpacity onPress={() => setStep('PHONE')} style={styles.backLink}>
            <Text style={styles.backText}>Change Phone Number</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: '400',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    lineHeight: 24,
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E8EB',
    marginBottom: 30,
  },
  icon: {
    marginRight: 12,
  },
  prefix: {
    fontSize: 18,
    color: Colors.text,
    marginRight: 12,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: Colors.text,
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 20,
  },
  buttonActive: {
    backgroundColor: Colors.primary,
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  buttonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  backLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  backText: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '500',
  }
});
