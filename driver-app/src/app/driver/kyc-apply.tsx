import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImagePlus, X } from 'lucide-react-native';
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

type DocKey = 'license' | 'aadhaar' | 'pan' | 'rc';

const DOC_UPLOADS: { key: DocKey; title: string; hint: string }[] = [
  { key: 'license', title: 'Driving licence photo *', hint: 'Clear photo of DL front' },
  { key: 'aadhaar', title: 'Aadhaar photo *', hint: 'Front side of Aadhaar' },
  { key: 'pan', title: 'PAN card photo *', hint: 'Clear PAN card image' },
  { key: 'rc', title: 'RC photo *', hint: 'Vehicle registration certificate' },
];

async function pickDocumentPhoto(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permission needed', 'Allow photo library access to upload KYC documents.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.45,
    base64: true,
    allowsEditing: true,
    aspect: [4, 3],
  });

  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  if (!asset.base64) {
    Alert.alert('Upload failed', 'Could not read image. Try another photo.');
    return null;
  }
  const mime = asset.mimeType || 'image/jpeg';
  return `data:${mime};base64,${asset.base64}`;
}

async function captureDocumentPhoto(): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permission needed', 'Allow camera access to capture KYC documents.');
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.45,
    base64: true,
    allowsEditing: true,
    aspect: [4, 3],
  });

  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  if (!asset.base64) {
    Alert.alert('Capture failed', 'Could not read photo. Try again.');
    return null;
  }
  const mime = asset.mimeType || 'image/jpeg';
  return `data:${mime};base64,${asset.base64}`;
}

function PhotoSlot({
  title,
  hint,
  uri,
  onPick,
  onCapture,
  onClear,
}: {
  title: string;
  hint: string;
  uri: string;
  onPick: () => void;
  onCapture: () => void;
  onClear: () => void;
}) {
  return (
    <View style={styles.photoSlot}>
      <Text style={styles.photoTitle}>{title}</Text>
      <Text style={styles.photoHint}>{hint}</Text>
      {uri ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri }} style={styles.preview} resizeMode="cover" />
          <Pressable style={styles.clearBtn} onPress={onClear} hitSlop={8}>
            <X color={Colors.white} size={16} />
          </Pressable>
          <Text style={styles.uploadedLabel}>Uploaded ✓</Text>
        </View>
      ) : (
        <View style={styles.photoActions}>
          <Pressable style={styles.photoBtn} onPress={onPick}>
            <ImagePlus color={Colors.primary} size={20} />
            <Text style={styles.photoBtnText}>Gallery</Text>
          </Pressable>
          <Pressable style={styles.photoBtn} onPress={onCapture}>
            <Camera color={Colors.primary} size={20} />
            <Text style={styles.photoBtnText}>Camera</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

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
  const [panNumber, setPanNumber] = useState('');
  const [insuranceNumber, setInsuranceNumber] = useState('');

  const [photos, setPhotos] = useState<Record<DocKey, string>>({
    license: '',
    aadhaar: '',
    pan: '',
    rc: '',
  });

  const setPhoto = (key: DocKey, uri: string) => {
    setPhotos((p) => ({ ...p, [key]: uri }));
  };

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
      if (aadhaarNumber.replace(/\D/g, '').length !== 12) return 'Enter valid 12-digit Aadhaar';
      if (panNumber.trim().length < 10) return 'Enter valid 10-character PAN';
      if (!photos.license) return 'Upload driving licence photo';
      if (!photos.aadhaar) return 'Upload Aadhaar photo';
      if (!photos.pan) return 'Upload PAN card photo';
      if (!photos.rc) return 'Upload RC photo';
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

  const choosePhoto = async (key: DocKey, mode: 'gallery' | 'camera') => {
    setError('');
    const uri = mode === 'camera' ? await captureDocumentPhoto() : await pickDocumentPhoto();
    if (uri) setPhoto(key, uri);
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
          licensePhoto: photos.license,
          rcNumber: (rcNumber || regNo).trim(),
          rcPhoto: photos.rc,
          aadhaarNumber: aadhaarNumber.replace(/\D/g, ''),
          aadhaarPhoto: photos.aadhaar,
          panNumber: panNumber.trim().toUpperCase(),
          panPhoto: photos.pan,
          insuranceNumber: insuranceNumber.trim(),
        },
      });
      Alert.alert(
        'KYC submitted',
        'Admin will verify your DL, Aadhaar, PAN, RC photos and details. After approval you will get Driver ID & password to login.',
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
      void res;
    } catch (e: any) {
      setError(e.message || 'Submit failed. Is backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <ScreenHeader title="Partner KYC" subtitle="Details + document photos for admin approval" />
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
              label="Aadhaar number *"
              value={aadhaarNumber}
              onChangeText={(t) => setAadhaarNumber(t.replace(/\D/g, '').slice(0, 12))}
              keyboardType="number-pad"
              maxLength={12}
              placeholder="12 digits"
            />
            <Input
              label="PAN number *"
              value={panNumber}
              onChangeText={(t) => setPanNumber(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
              autoCapitalize="characters"
              maxLength={10}
              placeholder="ABCDE1234F"
            />
            <Input
              label="Insurance policy no."
              value={insuranceNumber}
              onChangeText={setInsuranceNumber}
              placeholder="Optional"
            />

            <Text style={styles.uploadSection}>Document photos (required)</Text>
            {DOC_UPLOADS.map((d) => (
              <PhotoSlot
                key={d.key}
                title={d.title}
                hint={d.hint}
                uri={photos[d.key]}
                onPick={() => choosePhoto(d.key, 'gallery')}
                onCapture={() => choosePhoto(d.key, 'camera')}
                onClear={() => setPhoto(d.key, '')}
              />
            ))}

            <Text style={styles.note}>
              Upload clear photos of licence, Aadhaar, PAN and RC. Admin reviews all details and
              photos before approving login.
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
  uploadSection: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  photoSlot: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 12,
    backgroundColor: Colors.surfaceMuted,
    gap: 6,
  },
  photoTitle: { fontSize: 13, fontWeight: '800', color: Colors.text },
  photoHint: { fontSize: 11, color: Colors.textLight, fontWeight: '600' },
  photoActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photoBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  previewWrap: { marginTop: 4, borderRadius: Radius.md, overflow: 'hidden', position: 'relative' },
  preview: { width: '100%', height: 140, backgroundColor: '#ddd' },
  clearBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: Colors.success,
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: '800',
  },
  note: { fontSize: 12, color: Colors.textLight, lineHeight: 18, fontWeight: '500' },
  error: { color: Colors.error, fontWeight: '700', fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
