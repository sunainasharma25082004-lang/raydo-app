import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { User } from 'lucide-react-native';
import {
  getRiderProfile,
  saveRiderProfile,
  type RiderProfile,
} from '@/lib/session';

export default function EditProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        try {
          const p = await getRiderProfile();
          if (!active) return;
          setName(p.name);
          setPhone(p.phone);
          setEmail(p.email);
          setCity(p.city);
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const onSave = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Missing details', 'Name and phone number are required.');
      return;
    }
    setSaving(true);
    try {
      const next: RiderProfile = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        city: city.trim(),
      };
      await saveRiderProfile(next);
      Alert.alert('Profile updated', 'Your details have been saved.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Could not save', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Edit Profile" subtitle="Update your personal details" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <User color={Colors.white} size={36} />
              </View>
              <Text style={styles.avatarHint}>Changes save on this device</Text>
            </View>

            <Field label="Full name" value={name} onChangeText={setName} placeholder="Your name" />
            <Field
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 ..."
              keyboardType="phone-pad"
            />
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field label="City" value={city} onChangeText={setCity} placeholder="City" />

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={onSave}
              disabled={saving}
            >
              <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save changes'}</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textLight}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 24, paddingBottom: 40 },
  avatarWrap: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: { marginTop: 10, fontSize: 12, color: Colors.textLight },
  field: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textLight,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E4DC',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  saveBtn: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
