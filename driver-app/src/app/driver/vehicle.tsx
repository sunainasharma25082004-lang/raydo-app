import React from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import { Car, Gauge, Hash, Palette } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useDriver } from '@/context/DriverContext';
import { useSession } from '@/context/SessionContext';
import { Colors, Radius } from '@/constants/Colors';

export default function VehicleScreen() {
  const { driver } = useDriver();
  const { driver: session } = useSession();

  const type = session?.vehicle?.type || driver.vehicleCategory;
  const reg = session?.vehicle?.registrationNumber || driver.vehicle;
  const model = session?.vehicle?.model || driver.vehicleType;
  const color = session?.vehicle?.color || '—';
  const year = session?.vehicle?.year || '—';

  const rows = [
    { icon: Hash, label: 'Registration', value: reg },
    { icon: Car, label: 'Type', value: type },
    { icon: Palette, label: 'Model', value: model },
    { icon: Gauge, label: 'Color / Year', value: `${color} · ${year}` },
  ];

  return (
    <Screen scroll contentStyle={styles.content}>
      <ScreenHeader title="Vehicle details" subtitle="Registered for matching" />

      <Card style={styles.hero}>
        <View style={styles.iconWrap}>
          <Car size={28} color={Colors.white} />
        </View>
        <Text style={styles.plate}>{reg}</Text>
        <Text style={styles.type}>{type}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            Matching: {type === 'Bike' || type === 'Scooty' ? 'Two-wheeler requests' : `${type} only`}
          </Text>
        </View>
      </Card>

      <Card padded={false}>
        {rows.map((row, idx) => {
          const Icon = row.icon;
          return (
            <View key={row.label} style={[styles.row, idx < rows.length - 1 && styles.border]}>
              <View style={styles.rowIcon}>
                <Icon size={16} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{row.label}</Text>
                <Text style={styles.value}>{row.value}</Text>
              </View>
            </View>
          );
        })}
      </Card>

      <Text style={styles.rule}>
        Riders who request Scooty/Bike only see Scooty/Bike drivers. Auto → Auto. Car → Car.
      </Text>

      <Button
        title="Request vehicle update"
        variant="outline"
        fullWidth
        onPress={() =>
          Alert.alert(
            'Update requested',
            'Submit new KYC with updated RC. Admin re-approval required before type changes go live.',
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 14, paddingBottom: 28 },
  hero: { alignItems: 'center', gap: 8, paddingVertical: 22 },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  plate: { fontSize: 22, fontWeight: '800', color: Colors.text, letterSpacing: 1 },
  type: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  badge: {
    marginTop: 6,
    backgroundColor: Colors.successSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  badgeText: { color: Colors.success, fontWeight: '700', fontSize: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  border: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 12, color: Colors.textLight, fontWeight: '600' },
  value: { fontSize: 15, color: Colors.text, fontWeight: '700', marginTop: 2 },
  rule: {
    fontSize: 12,
    color: Colors.textLight,
    lineHeight: 18,
    fontWeight: '600',
  },
});
