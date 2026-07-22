import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Users, Car, Clock, CheckCircle2 } from 'lucide-react-native';
import { adminApi, AdminDriver } from '@/lib/api';
import { ADMIN_TOKEN, setAdminToken } from './login';

type Filter = 'pending' | 'approved' | 'rejected' | 'all';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('pending');
  const [drivers, setDrivers] = useState<AdminDriver[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [lastCredentials, setLastCredentials] = useState<{
    name: string;
    loginId: string;
    password: string;
  } | null>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [weeklyOpen, setWeeklyOpen] = useState(false);
  const [weeklyNote, setWeeklyNote] = useState('');
  const [tab, setTab] = useState<'kyc' | 'withdraw'>('kyc');

  const load = useCallback(async () => {
    if (!ADMIN_TOKEN) {
      router.replace('/admin/login');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.list(ADMIN_TOKEN, filter);
      setDrivers(res.drivers);
      setStats(res.stats || {});
      try {
        const p = await adminApi.platformStats(ADMIN_TOKEN);
        setStats((s) => ({ ...s, ...p }));
        const w = await adminApi.withdrawals(ADMIN_TOKEN, 'all');
        setWithdrawals(w.withdrawals || []);
        setWeeklyOpen(!!w.settings?.weeklyWithdrawOpen);
        setWeeklyNote(w.settings?.weeklyWithdrawNote || '');
      } catch {
        /* platform optional if old server */
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load');
      if (String(e.message).includes('401') || String(e.message).toLowerCase().includes('token')) {
        setAdminToken('');
        router.replace('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  }, [filter, router]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onApprove = async (d: AdminDriver) => {
    setBusyId(d.id);
    try {
      const res = await adminApi.approve(ADMIN_TOKEN, d.id);
      setLastCredentials({
        name: res.driver.name,
        loginId: res.credentials.loginId,
        password: res.credentials.password,
      });
      const msg = `Driver ID: ${res.credentials.loginId}\nPassword: ${res.credentials.password}\n\nShare with ${res.driver.name}`;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`KYC Approved\n\n${msg}`);
      } else {
        Alert.alert('KYC Approved — share credentials', msg);
      }
      await load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setBusyId(null);
    }
  };

  const onReject = async () => {
    if (!rejectId) return;
    setBusyId(rejectId);
    try {
      await adminApi.reject(ADMIN_TOKEN, rejectId, rejectReason || 'Documents incomplete');
      setRejectId(null);
      setRejectReason('');
      await load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setBusyId(null);
    }
  };

  const toggleWeekly = async (open: boolean) => {
    try {
      await adminApi.setWeeklyWindow(
        ADMIN_TOKEN,
        open,
        open ? 'Weekly withdrawals open — drivers may request payout' : 'Weekly window closed',
      );
      setWeeklyOpen(open);
      Alert.alert('Weekly withdraw', open ? 'OPEN for drivers' : 'CLOSED');
      await load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const decideW = async (id: string, decision: 'approve' | 'reject') => {
    try {
      await adminApi.decideWithdraw(ADMIN_TOKEN, id, decision);
      Alert.alert('Done', decision === 'approve' ? 'Marked paid' : 'Rejected & refunded');
      await load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const METRICS = [
    { title: 'Pending KYC', value: String(stats.pending ?? '—'), icon: Clock, color: Colors.accent },
    { title: 'Approved', value: String(stats.approved ?? '—'), icon: CheckCircle2, color: Colors.success },
    { title: 'Online now', value: String(stats.online ?? '—'), icon: Car, color: Colors.primary },
    {
      title: 'Withdraw pending',
      value: String(stats.withdrawalsPending ?? withdrawals.filter((w) => w.status === 'pending_admin').length),
      icon: Users,
      color: Colors.error,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Raydo Admin</Text>
          <Text style={styles.headerSub}>KYC · live rides · weekly withdrawals</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 8 }}>
          <TouchableOpacity onPress={() => router.push('/admin/about')}>
            <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 12 }}>About</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setAdminToken('');
              router.replace('/admin/login');
            }}
          >
            <Text style={styles.logout}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.metricsGrid}>
          {METRICS.map((m) => (
            <View key={m.title} style={styles.metricCard}>
              <View style={[styles.iconBg, { backgroundColor: m.color + '15' }]}>
                <m.icon color={m.color} size={22} />
              </View>
              <Text style={styles.metricValue}>{m.value}</Text>
              <Text style={styles.metricTitle}>{m.title}</Text>
            </View>
          ))}
        </View>

        <View style={styles.filters}>
          <TouchableOpacity
            style={[styles.chip, tab === 'kyc' && styles.chipOn]}
            onPress={() => setTab('kyc')}
          >
            <Text style={[styles.chipText, tab === 'kyc' && styles.chipTextOn]}>KYC</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, tab === 'withdraw' && styles.chipOn]}
            onPress={() => setTab('withdraw')}
          >
            <Text style={[styles.chipText, tab === 'withdraw' && styles.chipTextOn]}>
              Weekly withdraw
            </Text>
          </TouchableOpacity>
        </View>

        {tab === 'withdraw' ? (
          <View>
            <View style={[styles.card, { marginBottom: 12 }]}>
              <Text style={styles.name}>Weekly withdrawal window</Text>
              <Text style={styles.meta}>
                {weeklyOpen ? 'OPEN — drivers can request' : 'CLOSED — drivers cannot withdraw'}
              </Text>
              <Text style={[styles.meta, { marginBottom: 10 }]}>{weeklyNote}</Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnOk]}
                  onPress={() => toggleWeekly(true)}
                >
                  <Text style={styles.btnText}>Open this week</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnBad]}
                  onPress={() => toggleWeekly(false)}
                >
                  <Text style={styles.btnText}>Close window</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Withdrawal requests</Text>
            {withdrawals.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No withdrawals yet</Text>
              </View>
            ) : (
              withdrawals.map((w) => (
                <View key={w.id} style={styles.card}>
                  <Text style={styles.name}>
                    {w.driverName} · ₹{w.amount}
                  </Text>
                  <Text style={styles.meta}>
                    {w.loginId} · {w.upiId}
                  </Text>
                  <Text style={styles.meta}>Status: {w.status}</Text>
                  {w.status === 'pending_admin' ? (
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={[styles.btn, styles.btnOk]}
                        onPress={() => decideW(w.id, 'approve')}
                      >
                        <Text style={styles.btnText}>Approve pay</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.btn, styles.btnBad]}
                        onPress={() => decideW(w.id, 'reject')}
                      >
                        <Text style={styles.btnText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </View>
        ) : null}

        {tab === 'kyc' ? (
          <>

        {lastCredentials ? (
          <View style={styles.credBox}>
            <Text style={styles.credTitle}>Last issued credentials</Text>
            <Text style={styles.credLine}>{lastCredentials.name}</Text>
            <Text style={styles.credLine}>ID: {lastCredentials.loginId}</Text>
            <Text style={styles.credLine}>Password: {lastCredentials.password}</Text>
            <Text style={styles.credHint}>Share only with the partner offline / SMS.</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Driver KYC queue</Text>
        <View style={styles.filters}>
          {(['pending', 'approved', 'rejected', 'all'] as Filter[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, filter === f && styles.chipOn]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.chipText, filter === f && styles.chipTextOn]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? <ActivityIndicator color={Colors.primary} style={{ marginVertical: 24 }} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && drivers.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No {filter} applications</Text>
          </View>
        ) : null}

        {drivers.map((d) => (
          <View key={d.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{d.name}</Text>
                <Text style={styles.meta}>+91 {d.phone}</Text>
                <Text style={styles.meta}>
                  {d.vehicle?.type} · {d.vehicle?.registrationNumber}
                  {d.vehicle?.model ? ` · ${d.vehicle.model}` : ''}
                </Text>
              </View>
              <View
                style={[
                  styles.statusPill,
                  d.kycStatus === 'approved' && styles.statusOk,
                  d.kycStatus === 'rejected' && styles.statusBad,
                  d.kycStatus === 'pending' && styles.statusPend,
                ]}
              >
                <Text style={styles.statusText}>{d.kycStatus}</Text>
              </View>
            </View>

            <View style={styles.docBlock}>
              <Text style={styles.docLine}>DL: {d.documents?.licenseNumber || '—'}</Text>
              <Text style={styles.docLine}>RC: {d.documents?.rcNumber || d.vehicle?.registrationNumber}</Text>
              <Text style={styles.docLine}>
                Aadhaar: {d.documents?.aadhaarNumber ? `XXXX${String(d.documents.aadhaarNumber).slice(-4)}` : '—'}
              </Text>
              {d.loginId ? <Text style={styles.docLine}>Login ID: {d.loginId}</Text> : null}
              {d.tempPassword && d.kycStatus === 'approved' ? (
                <Text style={styles.docLine}>Password: {d.tempPassword}</Text>
              ) : null}
              {d.kycRejectionReason ? (
                <Text style={[styles.docLine, { color: Colors.error }]}>
                  Reason: {d.kycRejectionReason}
                </Text>
              ) : null}
            </View>

            {d.kycStatus === 'pending' ? (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnOk]}
                  onPress={() => onApprove(d)}
                  disabled={busyId === d.id}
                >
                  <Text style={styles.btnText}>
                    {busyId === d.id ? '…' : 'Approve & issue ID'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnBad]}
                  onPress={() => {
                    setRejectId(d.id);
                    setRejectReason('');
                  }}
                >
                  <Text style={styles.btnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {d.kycStatus === 'approved' ? (
              <TouchableOpacity style={[styles.btn, styles.btnOk]} onPress={() => onApprove(d)}>
                <Text style={styles.btnText}>Show credentials again</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ))}

        {rejectId ? (
          <View style={styles.rejectBox}>
            <Text style={styles.sectionTitle}>Reject reason</Text>
            <TextInput
              style={styles.input}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="e.g. Unclear DL photo / wrong RC"
              placeholderTextColor={Colors.textLight}
            />
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.btn, styles.btnBad]} onPress={onReject}>
                <Text style={styles.btnText}>Confirm reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: Colors.textLight }]}
                onPress={() => setRejectId(null)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <TouchableOpacity style={styles.refresh} onPress={load}>
          <Text style={styles.refreshText}>Refresh list</Text>
        </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E8EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  headerSub: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  logout: { color: Colors.error, fontWeight: '700' },
  content: { padding: 20, paddingBottom: 48 },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: { fontSize: 22, fontWeight: '800', color: Colors.text },
  metricTitle: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E5E8EB',
  },
  chipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: Colors.textLight },
  chipTextOn: { color: '#fff' },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', gap: 10 },
  name: { fontSize: 17, fontWeight: '800', color: Colors.text },
  meta: { fontSize: 13, color: Colors.textLight, marginTop: 2, fontWeight: '500' },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusOk: { backgroundColor: '#E8F5E9' },
  statusBad: { backgroundColor: '#FFEBEE' },
  statusPend: { backgroundColor: '#FFF8E1' },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', color: Colors.text },
  docBlock: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 4,
  },
  docLine: { fontSize: 13, color: Colors.text, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnOk: { backgroundColor: Colors.success },
  btnBad: { backgroundColor: Colors.error },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  empty: {
    backgroundColor: Colors.white,
    padding: 28,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: { color: Colors.textLight },
  error: { color: Colors.error, marginBottom: 12, fontWeight: '600' },
  rejectBox: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E8EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    color: Colors.text,
  },
  credBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  credTitle: { fontWeight: '800', color: Colors.success, marginBottom: 6 },
  credLine: { fontSize: 14, fontWeight: '700', color: Colors.text, marginTop: 2 },
  credHint: { fontSize: 11, color: Colors.textLight, marginTop: 8 },
  refresh: { alignItems: 'center', paddingVertical: 16 },
  refreshText: { color: Colors.primary, fontWeight: '700' },
});
