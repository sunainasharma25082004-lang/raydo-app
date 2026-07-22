import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Colors } from '@/constants/Colors';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Check, CreditCard, Smartphone, Banknote } from 'lucide-react-native';

type Method = {
  id: string;
  title: string;
  subtitle: string;
  icon: 'upi' | 'cash' | 'card';
};

const METHODS: Method[] = [
  { id: 'upi', title: 'UPI', subtitle: 'GPay · PhonePe · Paytm', icon: 'upi' },
  { id: 'cash', title: 'Cash', subtitle: 'Pay driver at drop', icon: 'cash' },
  { id: 'card', title: 'Debit / Credit card', subtitle: '**** 4242 · Visa', icon: 'card' },
];

export default function PaymentMethodsScreen() {
  const [selected, setSelected] = useState('upi');

  const IconFor = ({ type }: { type: Method['icon'] }) => {
    if (type === 'upi') return <Smartphone color={Colors.primary} size={20} />;
    if (type === 'cash') return <Banknote color={Colors.primary} size={20} />;
    return <CreditCard color={Colors.primary} size={20} />;
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Payment Methods" subtitle="Choose default for rides" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Available methods</Text>
        {METHODS.map((m) => {
          const active = selected === m.id;
          return (
            <TouchableOpacity
              key={m.id}
              style={[styles.card, active && styles.cardActive]}
              onPress={() => setSelected(m.id)}
              activeOpacity={0.85}
            >
              <View style={styles.iconBg}>
                <IconFor type={m.icon} />
              </View>
              <View style={styles.info}>
                <Text style={styles.title}>{m.title}</Text>
                <Text style={styles.sub}>{m.subtitle}</Text>
              </View>
              <View style={[styles.radio, active && styles.radioOn]}>
                {active ? <Check color={Colors.white} size={14} /> : null}
              </View>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() =>
            Alert.alert(
              'Default payment saved',
              `${METHODS.find((x) => x.id === selected)?.title} will be used for new rides.`,
            )
          }
        >
          <Text style={styles.saveText}>Save as default</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() =>
            Alert.alert('Add method', 'Card/UPI linking will be available in the next release.')
          }
        >
          <Text style={styles.secondaryText}>+ Add new method</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textLight,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#EDEAE3',
  },
  cardActive: {
    borderColor: Colors.accent,
    backgroundColor: '#FDFBF6',
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: Colors.text },
  sub: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  saveBtn: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryText: { color: Colors.accent, fontSize: 15, fontWeight: '600' },
});
