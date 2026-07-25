import React, { useCallback, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { TrendingUp, Wallet, Banknote } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/context/SessionContext';
import { api } from '@/lib/api';
import { formatInr } from '@/data/mock';
import { Colors, Radius } from '@/constants/Colors';

export default function EarningsScreen() {
  const { token } = useSession();
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [lifetime, setLifetime] = useState(0);
  const [trips, setTrips] = useState(0);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [upi, setUpi] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const w = await api.wallet(token);
      setWalletBalance(w.walletBalance);
      setLifetime(w.lifetimeEarnings);
      setTrips(w.completedTrips || w.totalRides || 0);
      setOpen(w.weeklyWithdrawOpen);
      setNote(w.weeklyWithdrawNote);
      setWithdrawals(w.withdrawals || []);
    } catch (e: any) {
      Alert.alert('Wallet', e.message || 'Could not load wallet — is backend running?');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onWithdraw = async () => {
    if (!token) {
      Alert.alert('Login required', 'Login with admin-issued Driver ID first.');
      return;
    }
    if (!open) {
      Alert.alert('Withdrawals closed', note || 'Admin has not opened weekly withdrawals yet.');
      return;
    }
    const amt = Number(amount);
    if (!amt || amt < 100) {
      Alert.alert('Amount', 'Minimum withdrawal is ₹100');
      return;
    }
    if (!upi.trim()) {
      Alert.alert('UPI', 'Enter your UPI ID');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.withdraw(token, amt, upi.trim());
      Alert.alert('Submitted', res.message);
      setAmount('');
      await load();
    } catch (e: any) {
      Alert.alert('Withdraw failed', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      scroll
      contentStyle={styles.content}
    >
      <Text style={styles.title}>Earnings</Text>
      <Text style={styles.sub}>Real wallet · weekly withdraw needs admin permission</Text>

      {loading ? <ActivityIndicator color={Colors.primary} /> : null}

      <Card style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.iconBubble}>
            <Wallet size={20} color={Colors.primary} />
          </View>
          <View style={[styles.badge, open ? styles.badgeOk : styles.badgeOff]}>
            <TrendingUp size={12} color={open ? Colors.success : Colors.warning} />
            <Text style={[styles.badgeText, { color: open ? Colors.success : Colors.warning }]}>
              {open ? 'Withdraw open' : 'Withdraw closed'}
            </Text>
          </View>
        </View>
        <Text style={styles.heroLabel}>Available balance</Text>
        <Text style={styles.heroValue}>{formatInr(walletBalance)}</Text>
        <Text style={styles.heroHint}>{note}</Text>
      </Card>

      <View style={styles.row}>
        <Card style={styles.mini}>
          <Text style={styles.miniLabel}>Lifetime</Text>
          <Text style={styles.miniValue}>{formatInr(lifetime)}</Text>
        </Card>
        <Card style={styles.mini}>
          <Text style={styles.miniLabel}>Completed</Text>
          <Text style={styles.miniValue}>{trips}</Text>
          <Text style={styles.miniMeta}>real trips</Text>
        </Card>
      </View>

      <Card style={{ gap: 10 }}>
        <Text style={styles.sectionTitle}>Request weekly withdrawal</Text>
        <Text style={styles.help}>
          Admin opens withdrawals weekly. Your request stays pending until admin approves payment.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Amount (₹)"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          placeholderTextColor={Colors.textLight}
        />
        <TextInput
          style={styles.input}
          placeholder="UPI ID (name@upi)"
          autoCapitalize="none"
          value={upi}
          onChangeText={setUpi}
          placeholderTextColor={Colors.textLight}
        />
        <Button
          title="Submit for admin approval"
          fullWidth
          loading={submitting}
          leftIcon={<Banknote size={16} color={Colors.white} />}
          onPress={onWithdraw}
          disabled={!open}
        />
        <Button title="Refresh wallet" variant="outline" fullWidth onPress={load} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Withdrawal history</Text>
        {withdrawals.length === 0 ? (
          <Text style={styles.help}>No withdrawal requests yet.</Text>
        ) : (
          withdrawals.map((w) => (
            <View key={w.id} style={styles.wRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.wAmt}>{formatInr(w.amount)}</Text>
                <Text style={styles.help}>{w.upiId}</Text>
                <Text style={styles.help}>{new Date(w.createdAt).toLocaleString()}</Text>
              </View>
              <Text
                style={[
                  styles.wStatus,
                  w.status === 'paid' && { color: Colors.success },
                  w.status === 'rejected' && { color: Colors.error },
                  w.status === 'pending_admin' && { color: Colors.warning },
                ]}
              >
                {w.status}
              </Text>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 14, paddingBottom: 32, paddingTop: 8 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  sub: { fontSize: 13, color: Colors.textLight, fontWeight: '600', marginTop: -6 },
  heroCard: { gap: 6 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  badgeOk: { backgroundColor: Colors.successSoft },
  badgeOff: { backgroundColor: Colors.warningSoft },
  badgeText: { fontSize: 11, fontWeight: '800' },
  heroLabel: { fontSize: 13, color: Colors.textLight, fontWeight: '600' },
  heroValue: { fontSize: 32, fontWeight: '800', color: Colors.primary },
  heroHint: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 10 },
  mini: { flex: 1 },
  miniLabel: { fontSize: 12, color: Colors.textLight, fontWeight: '600' },
  miniValue: { fontSize: 20, fontWeight: '800', color: Colors.text, marginTop: 4 },
  miniMeta: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text },
  help: { fontSize: 12, color: Colors.textLight, fontWeight: '500', lineHeight: 17 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  wRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  wAmt: { fontSize: 16, fontWeight: '800', color: Colors.text },
  wStatus: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
});
