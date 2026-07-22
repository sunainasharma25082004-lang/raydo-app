import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api, DriverProfile } from '@/lib/api';
import { Colors, Radius } from '@/constants/Colors';

export default function KycStatusScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string }>();
  const [phone, setPhone] = useState(String(params.phone || ''));
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (p?: string) => {
    const q = (p || phone).replace(/\D/g, '').slice(-10);
    if (q.length !== 10) {
      setError('Enter 10-digit phone used in KYC');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.kycStatus({ phone: q });
      setDriver(res.driver);
    } catch (e: any) {
      setDriver(null);
      setError(e.message || 'Not found');
    } finally {
      setLoading(false);
    }
  }, [phone]);

  useFocusEffect(
    useCallback(() => {
      if (params.phone) load(String(params.phone));
    }, [params.phone, load]),
  );

  const statusColor =
    driver?.kycStatus === 'approved'
      ? Colors.success
      : driver?.kycStatus === 'rejected'
        ? Colors.error
        : Colors.warning;

  return (
    <Screen scroll contentStyle={styles.content}>
      <ScreenHeader title="KYC status" subtitle="Track admin verification" />

      <Card style={styles.card}>
        <Input
          label="Phone used in application"
          value={phone}
          onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
          keyboardType="phone-pad"
          maxLength={10}
          placeholder="9876543210"
        />
        <Button title="Check status" onPress={() => load()} loading={loading} fullWidth />
      </Card>

      {loading ? <ActivityIndicator color={Colors.primary} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {driver ? (
        <Card style={styles.card}>
          <View style={[styles.badge, { backgroundColor: statusColor + '22' }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {String(driver.kycStatus).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{driver.name}</Text>
          <Text style={styles.meta}>+91 {driver.phone}</Text>
          <Text style={styles.meta}>
            {driver.vehicle?.type} · {driver.vehicle?.registrationNumber}
          </Text>
          <Text style={styles.meta}>DL: {driver.documents?.licenseNumber || '—'}</Text>

          {driver.kycStatus === 'pending' ? (
            <Text style={styles.help}>
              Admin is reviewing your documents. You cannot login until approved. After approval you
              will receive Driver ID & password.
            </Text>
          ) : null}

          {driver.kycStatus === 'rejected' ? (
            <>
              <Text style={styles.help}>
                Reason: {driver.kycRejectionReason || 'Documents rejected'}
              </Text>
              <Button
                title="Re-apply KYC"
                fullWidth
                onPress={() => router.push('/driver/kyc-apply')}
              />
            </>
          ) : null}

          {driver.kycStatus === 'approved' ? (
            <>
              <Text style={styles.help}>
                Approved! Login with the Driver ID & password shared by admin.
              </Text>
              {driver.loginId ? (
                <Text style={styles.loginId}>Driver ID: {driver.loginId}</Text>
              ) : null}
              <Button title="Go to login" fullWidth onPress={() => router.replace('/driver/login')} />
            </>
          ) : null}
        </Card>
      ) : null}

      <Button
        title="Apply for KYC"
        variant="outline"
        fullWidth
        onPress={() => router.push('/driver/kyc-apply')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 12, paddingBottom: 28 },
  card: { gap: 12 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  badgeText: { fontWeight: '800', fontSize: 12 },
  name: { fontSize: 20, fontWeight: '800', color: Colors.text },
  meta: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  help: { fontSize: 13, color: Colors.textLight, lineHeight: 19, fontWeight: '500' },
  loginId: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
    backgroundColor: Colors.surfaceMuted,
    padding: 12,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  error: { color: Colors.error, fontWeight: '700' },
});
