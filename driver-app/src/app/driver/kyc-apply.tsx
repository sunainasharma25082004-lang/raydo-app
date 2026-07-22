import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { api, VehicleType } from '@/lib/api';
import { Colors, Radius } from '@/constants/Colors';

const VEHICLE_OPTIONS: { type: VehicleType; label: string; hint: string }[] = [
  { type: 'Scooty', label: 'Scooty / Scooter', hint: 'Two-wheeler' },
  { type: 'Bike', label: 'Bike', hint: 'Two-wheeler' },
  { type: 'Auto', label: 'Auto', hint: 'Three-wheeler' },
  { type: 'Car', label: 'Car / Cab', hint: 'Four-wheeler' },
];

export default function KycApplyScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Bengaluru');

  const [vehicleType, setVehicleType] = useState<VehicleType>('Auto');
  const [regNo, setRegNo] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [year, setYear] = useState('');

  const [licenseNumber, setLicenseNumber] = useState('');
  const [rcNumber, setRcNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [insuranceNumber, setInsuranceNumber] = useState('');

  const validateStep = () => {
    if (step === 0) {
      if (!name.trim()) return 'Enter full name';
      if (phone.replace(/\D/g, '').length !== 10) return 'Enter valid 10-digit phone';
    }
    if (step === 1) {
      if (!regNo.trim()) return 'Enter vehicle registration number';
    }
    if (step === 2) {
      if (!licenseNumber.trim()) return 'Driving licence number is required';
    }
    return '';
  };

  const next = () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setStep((s) => Math.min(2, s + 1));
  };

  const submit = async () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.applyKyc({
        name: name.trim(),
        phone: phone.replace(/\D/g, '').slice(-10),
        email,
        city,
        vehicle: {
          type: vehicleType,
          registrationNumber: regNo.trim(),
          model: model.trim(),
          color: color.trim(),
          year: year.trim(),
        },
        documents: {
          licenseNumber: licenseNumber.trim(),
          rcNumber: (rcNumber || regNo).trim(),
          aadhaarNumber: aadhaarNumber.replace(/\D/g, ''),
          insuranceNumber: insuranceNumber.trim(),
        },
      });
      Alert.alert(
        'KYC submitted',
        'Admin will verify your DL, RC and vehicle details. After approval you will get Driver ID & password to login.',
        [
          {
            text: 'Check status',
            onPress: () =>
              router.replace({
                pathname: '/driver/kyc-status',
                params: { phone: phone.replace(/\D/g, '').slice(-10) },
              }),
          },
        ],
      );
      // Keep res for future
      void res;
    } catch (e: any) {
      setError(e.message || 'Submit failed. Is backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <ScreenHeader title="Partner KYC" subtitle="Fill details for admin approval" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.steps}>
          {['Personal', 'Vehicle', 'Documents'].map((label, i) => (
            <View key={label} style={[styles.stepPill, step === i && styles.stepPillOn]}>
              <Text style={[styles.stepText, step === i && styles.stepTextOn]}>
                {i + 1}. {label}
              </Text>
            </View>
          ))}
        </View>

        {step === 0 && (
          <Card style={styles.card}>
            <Input label="Full name" value={name} onChangeText={setName} placeholder="As on licence" />
            <Input
              label="Mobile number"
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
              keyboardType="phone-pad"
              maxLength={10}
              placeholder="10-digit phone"
            />
            <Input
              label="Email (optional)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@email.com"
            />
            <Input label="City" value={city} onChangeText={setCity} placeholder="Bengaluru" />
          </Card>
        )}

        {step === 1 && (
          <Card style={styles.card}>
            <Text style={styles.label}>Vehicle type</Text>
            <Text style={styles.hint}>
              Rider Scooty/Bike → only two-wheelers · Auto → auto · Car → car
            </Text>
            <View style={styles.vGrid}>
              {VEHICLE_OPTIONS.map((v) => {
                const on = vehicleType === v.type;
                return (
                  <Pressable
                    key={v.type}
                    style={[styles.vCard, on && styles.vCardOn]}
                    onPress={() => setVehicleType(v.type)}
                  >
                    <Text style={[styles.vTitle, on && styles.vTitleOn]}>{v.label}</Text>
                    <Text style={styles.vHint}>{v.hint}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Input
              label="Registration number"
              value={regNo}
              onChangeText={setRegNo}
              placeholder="KA 01 AB 1234"
              autoCapitalize="characters"
            />
            <Input label="Model" value={model} onChangeText={setModel} placeholder="Bajaj RE / Activa / Swift" />
            <Input label="Color" value={color} onChangeText={setColor} placeholder="Yellow / White" />
            <Input
              label="Model year"
              value={year}
              onChangeText={setYear}
              placeholder="2022"
              keyboardType="number-pad"
            />
          </Card>
        )}

        {step === 2 && (
          <Card style={styles.card}>
            <Input
              label="Driving licence number *"
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              placeholder="KA01 20200012345"
              autoCapitalize="characters"
            />
            <Input
              label="RC number"
              value={rcNumber}
              onChangeText={setRcNumber}
              placeholder="Same as registration if unsure"
              autoCapitalize="characters"
            />
            <Input
              label="Aadhaar number"
              value={aadhaarNumber}
              onChangeText={(t) => setAadhaarNumber(t.replace(/\D/g, '').slice(0, 12))}
              keyboardType="number-pad"
              maxLength={12}
              placeholder="12 digits"
            />
            <Input
              label="Insurance policy no."
              value={insuranceNumber}
              onChangeText={setInsuranceNumber}
              placeholder="Optional for demo"
            />
            <Text style={styles.note}>
              Demo accepts numbers without photo upload. Admin reviews and issues login credentials.
            </Text>
          </Card>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actions}>
          {step > 0 ? (
            <Button title="Back" variant="outline" onPress={() => setStep((s) => s - 1)} style={{ flex: 1 }} />
          ) : null}
          {step < 2 ? (
            <Button title="Continue" onPress={next} style={{ flex: 1 }} />
          ) : (
            <Button title="Submit KYC" onPress={submit} loading={loading} style={{ flex: 1 }} />
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 12, paddingBottom: 32 },
  steps: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  stepPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceMuted,
  },
  stepPillOn: { backgroundColor: Colors.primary },
  stepText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  stepTextOn: { color: Colors.white },
  card: { gap: 12 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  hint: { fontSize: 12, color: Colors.textLight, marginBottom: 4, fontWeight: '600' },
  vGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vCard: {
    width: '48%',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 12,
    backgroundColor: Colors.surface,
  },
  vCardOn: { borderColor: Colors.accent, backgroundColor: Colors.accentSoft },
  vTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },
  vTitleOn: { color: Colors.primary },
  vHint: { fontSize: 11, color: Colors.textLight, marginTop: 2, fontWeight: '600' },
  note: { fontSize: 12, color: Colors.textLight, lineHeight: 18, fontWeight: '500' },
  error: { color: Colors.error, fontWeight: '700', fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
