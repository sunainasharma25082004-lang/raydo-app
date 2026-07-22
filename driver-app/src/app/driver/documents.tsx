import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { BadgeCheck, FileWarning, IdCard, Shield } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/context/SessionContext';
import { useDriver } from '@/context/DriverContext';
import { Colors, Radius } from '@/constants/Colors';
import { useRouter } from 'expo-router';

export default function DocumentsScreen() {
  const { driver: session } = useSession();
  const { driver } = useDriver();
  const router = useRouter();

  const docs = session?.documents;
  const approved = session?.kycStatus === 'approved' || !session;

  const DOCS = [
    {
      id: 'dl',
      title: 'Driving licence',
      status: docs?.licenseStatus || (approved ? 'Approved' : 'Pending'),
      ok: (docs?.licenseStatus || 'Approved') === 'Approved',
      expiry: docs?.licenseNumber || 'On file',
    },
    {
      id: 'rc',
      title: 'Vehicle RC',
      status: docs?.rcStatus || (approved ? 'Approved' : 'Pending'),
      ok: (docs?.rcStatus || 'Approved') === 'Approved',
      expiry: docs?.rcNumber || driver.vehicle,
    },
    {
      id: 'aadhaar',
      title: 'Aadhaar',
      status: docs?.aadhaarStatus || (approved ? 'Approved' : 'Pending'),
      ok: (docs?.aadhaarStatus || 'Approved') === 'Approved',
      expiry: docs?.aadhaarNumber ? `XXXX ${docs.aadhaarNumber.slice(-4)}` : 'On file',
    },
    {
      id: 'ins',
      title: 'Insurance',
      status: docs?.insuranceStatus || (approved ? 'Approved' : 'Pending'),
      ok: (docs?.insuranceStatus || 'Approved') === 'Approved',
      expiry: docs?.insuranceNumber || 'On file',
    },
  ];

  return (
    <Screen scroll contentStyle={styles.content}>
      <ScreenHeader title="Documents / KYC" subtitle="Admin-verified papers" />

      <Card style={styles.summary}>
        <Shield size={20} color={approved ? Colors.success : Colors.warning} />
        <View style={{ flex: 1 }}>
          <Text style={styles.summaryTitle}>
            {approved ? 'KYC approved' : `Status: ${session?.kycStatus || 'unknown'}`}
          </Text>
          <Text style={styles.summarySub}>
            {driver.vehicleCategory} · {driver.vehicle}
            {driver.loginId ? ` · ${driver.loginId}` : ''}
          </Text>
        </View>
      </Card>

      <Card padded={false}>
        {DOCS.map((doc, idx) => (
          <View key={doc.id} style={[styles.row, idx < DOCS.length - 1 && styles.border]}>
            <View style={[styles.icon, !doc.ok && styles.iconWarn]}>
              {doc.ok ? (
                <BadgeCheck size={18} color={Colors.success} />
              ) : (
                <FileWarning size={18} color={Colors.warning} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{doc.title}</Text>
              <Text style={styles.meta}>{doc.expiry}</Text>
            </View>
            <View style={[styles.pill, doc.ok ? styles.pillOk : styles.pillWarn]}>
              <Text style={[styles.pillText, doc.ok ? styles.pillOkText : styles.pillWarnText]}>
                {doc.status}
              </Text>
            </View>
          </View>
        ))}
      </Card>

      <Button
        title="View KYC application status"
        variant="outline"
        fullWidth
        leftIcon={<IdCard size={16} color={Colors.primary} />}
        onPress={() => router.push('/driver/kyc-status')}
      />

      <Button
        title="Update documents"
        fullWidth
        onPress={() =>
          Alert.alert(
            'Update via re-KYC',
            'Submit a new KYC application from login screen. Admin must re-approve before credentials change.',
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 14, paddingBottom: 28 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: Colors.text },
  summarySub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  border: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWarn: { backgroundColor: Colors.warningSoft },
  title: { fontSize: 15, fontWeight: '700', color: Colors.text },
  meta: { fontSize: 12, color: Colors.textLight, marginTop: 2, fontWeight: '600' },
  pill: {
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillOk: { backgroundColor: Colors.successSoft },
  pillWarn: { backgroundColor: Colors.warningSoft },
  pillText: { fontSize: 11, fontWeight: '700' },
  pillOkText: { color: Colors.success },
  pillWarnText: { color: Colors.warning },
});
