import React, { useCallback, useMemo, useState } from 'react';
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
import {
  Users,
  Car,
  Clock,
  CheckCircle2,
  Ban,
  Star,
  ThumbsUp,
  ThumbsDown,
  Wallet,
  RefreshCw,
  Shield,
  LogOut,
  Search,
  X,
  Info,
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { adminApi, AdminDriver, AdminRider } from '@/lib/api';
import { ADMIN_TOKEN, setAdminToken } from './login';

type Filter = 'pending' | 'approved' | 'rejected' | 'all';
type Tab = 'kyc' | 'riders' | 'withdraw';
type RiderFilter = 'all' | 'active' | 'blocked';

function alertMsg(title: string, msg: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${msg}`);
  } else {
    Alert.alert(title, msg);
  }
}

function confirmAction(title: string, msg: string, onYes: () => void) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (window.confirm(`${title}\n\n${msg}`)) onYes();
  } else {
    Alert.alert(title, msg, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', style: 'destructive', onPress: onYes },
    ]);
  }
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('pending');
  const [drivers, setDrivers] = useState<AdminDriver[]>([]);
  const [stats, setStats] = useState<Record<string, any>>({});
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
  const [tab, setTab] = useState<Tab>('kyc');
  const [riders, setRiders] = useState<AdminRider[]>([]);
  const [riderFilter, setRiderFilter] = useState<RiderFilter>('all');
  const [riderSearch, setRiderSearch] = useState('');
  const [blockId, setBlockId] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState('');

  const filteredRiders = useMemo(() => {
    const q = riderSearch.trim().toLowerCase();
    if (!q) return riders;
    const digits = q.replace(/\D/g, '');
    return riders.filter((r) => {
      const name = (r.name || '').toLowerCase();
      const phone = (r.phone || '').toLowerCase();
      const phoneDigits = (r.phone || '').replace(/\D/g, '');
      const id = (r.id || '').toLowerCase();
      return (
        name.includes(q) ||
        phone.includes(q) ||
        id.includes(q) ||
        (digits.length >= 3 && phoneDigits.includes(digits))
      );
    });
  }, [riders, riderSearch]);

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
        const r = await adminApi.riders(ADMIN_TOKEN, riderFilter);
        setRiders(r.riders || []);
        if (r.stats) setStats((s) => ({ ...s, ...r.stats }));
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
  }, [filter, riderFilter, router]);

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
      alertMsg(
        'KYC Approved',
        `Driver ID: ${res.credentials.loginId}\nPassword: ${res.credentials.password}\n\nShare with ${res.driver.name}`,
      );
      await load();
    } catch (e: any) {
      alertMsg('Error', e.message);
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
      alertMsg('Error', e.message);
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
      alertMsg('Weekly withdraw', open ? 'OPEN for drivers' : 'CLOSED');
      await load();
    } catch (e: any) {
      alertMsg('Error', e.message);
    }
  };

  const decideW = async (id: string, decision: 'approve' | 'reject') => {
    try {
      await adminApi.decideWithdraw(ADMIN_TOKEN, id, decision);
      alertMsg('Done', decision === 'approve' ? 'Marked paid' : 'Rejected & refunded');
      await load();
    } catch (e: any) {
      alertMsg('Error', e.message);
    }
  };

  const onBlockRider = async (rider: AdminRider, blocked: boolean) => {
    if (blocked) {
      setBlockId(rider.id);
      setBlockReason(rider.blockReason || 'Policy violation');
      return;
    }
    confirmAction('Unblock rider', `Allow ${rider.name} to book rides again?`, async () => {
      setBusyId(rider.id);
      try {
        await adminApi.blockRider(ADMIN_TOKEN, rider.id, false);
        await load();
      } catch (e: any) {
        alertMsg('Error', e.message);
      } finally {
        setBusyId(null);
      }
    });
  };

  const confirmBlock = async () => {
    if (!blockId) return;
    setBusyId(blockId);
    try {
      await adminApi.blockRider(
        ADMIN_TOKEN,
        blockId,
        true,
        blockReason.trim() || 'Blocked by admin',
      );
      setBlockId(null);
      setBlockReason('');
      await load();
    } catch (e: any) {
      alertMsg('Error', e.message);
    } finally {
      setBusyId(null);
    }
  };

  const METRICS = [
    {
      title: 'Pending KYC',
      value: String(stats.pending ?? '—'),
      icon: Clock,
      color: Colors.accent,
    },
    {
      title: 'Approved drivers',
      value: String(stats.approved ?? '—'),
      icon: CheckCircle2,
      color: Colors.success,
    },
    {
      title: 'Total riders',
      value: String(stats.ridersTotal ?? riders.length ?? '—'),
      icon: Users,
      color: Colors.primary,
    },
    {
      title: 'Blocked riders',
      value: String(stats.ridersBlocked ?? riders.filter((r) => r.blocked).length),
      icon: Ban,
      color: Colors.error,
    },
    {
      title: 'Good reviews',
      value: String(stats.goodReviewsTotal ?? '—'),
      icon: ThumbsUp,
      color: Colors.success,
    },
    {
      title: 'Bad reviews',
      value: String(stats.badReviewsTotal ?? '—'),
      icon: ThumbsDown,
      color: Colors.error,
    },
    {
      title: 'Total rides',
      value: String(stats.ridesTotal ?? '—'),
      icon: Car,
      color: '#4A6FA5',
    },
    {
      title: 'Withdraw pending',
      value: String(
        stats.withdrawalsPending ??
          withdrawals.filter((w) => w.status === 'pending_admin').length,
      ),
      icon: Wallet,
      color: Colors.accent,
    },
  ];

  const TABS: { key: Tab; label: string }[] = [
    { key: 'kyc', label: 'Driver KYC' },
    { key: 'riders', label: 'Riders' },
    { key: 'withdraw', label: 'Payouts' },
  ];

  const PRIMARY_METRICS = METRICS.slice(0, 4);
  const SECONDARY_METRICS = METRICS.slice(4);

  return (
    <View style={styles.container}>
      {/* Clean professional header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.brandRow}>
            <View style={styles.headerBadge}>
              <Shield color={Colors.accent} size={20} strokeWidth={2} />
            </View>
            <View style={styles.brandText}>
              <Text style={styles.headerEyebrow}>CONTROL CENTER</Text>
              <Text style={styles.headerTitle}>Raydo Admin</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={load}
              accessibilityLabel="Refresh"
            >
              <RefreshCw color={Colors.primary} size={18} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => router.push('/admin/about')}
              accessibilityLabel="About"
            >
              <Info color={Colors.primary} size={18} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logoutIconBtn}
              onPress={() => {
                setAdminToken('');
                router.replace('/admin/login');
              }}
              accessibilityLabel="Logout"
            >
              <LogOut color="#fff" size={17} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabItem, tab === t.key && styles.tabItemOn]}
              onPress={() => setTab(t.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, tab === t.key && styles.tabTextOn]}>{t.label}</Text>
              {tab === t.key ? <View style={styles.tabUnderline} /> : null}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Overview</Text>
        <View style={styles.metricsGrid}>
          {PRIMARY_METRICS.map((m) => (
            <View key={m.title} style={styles.metricCard}>
              <View style={styles.metricTop}>
                <View style={[styles.iconBg, { backgroundColor: m.color + '18' }]}>
                  <m.icon color={m.color} size={16} />
                </View>
              </View>
              <Text style={styles.metricValue}>{m.value}</Text>
              <Text style={styles.metricTitle}>{m.title}</Text>
            </View>
          ))}
        </View>

        <View style={styles.secondaryMetrics}>
          {SECONDARY_METRICS.map((m) => (
            <View key={m.title} style={styles.secondaryChip}>
              <m.icon color={m.color} size={14} />
              <Text style={styles.secondaryValue}>{m.value}</Text>
              <Text style={styles.secondaryLabel}>{m.title}</Text>
            </View>
          ))}
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 28 }} />
        ) : null}

        {/* ——— RIDERS TAB ——— */}
        {tab === 'riders' && !loading ? (
          <View>
            <Text style={styles.sectionTitle}>Rider management</Text>
            <Text style={styles.sectionHint}>
              Search · block · rides taken · good vs bad reviews (★4–5 good, ★1–2 bad)
            </Text>

            <View style={styles.searchWrap}>
              <Search color={Colors.textLight} size={18} />
              <TextInput
                style={styles.searchInput}
                value={riderSearch}
                onChangeText={setRiderSearch}
                placeholder="Search name, phone or rider ID…"
                placeholderTextColor={Colors.textLight}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
              {riderSearch.length > 0 ? (
                <TouchableOpacity onPress={() => setRiderSearch('')} hitSlop={10}>
                  <X color={Colors.textLight} size={18} />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.filters}>
              {(['all', 'active', 'blocked'] as RiderFilter[]).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.chip, riderFilter === f && styles.chipOn]}
                  onPress={() => setRiderFilter(f)}
                >
                  <Text style={[styles.chipText, riderFilter === f && styles.chipTextOn]}>
                    {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Blocked'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {riders.length > 0 ? (
              <Text style={styles.resultCount}>
                {filteredRiders.length === riders.length
                  ? `${riders.length} rider${riders.length === 1 ? '' : 's'}`
                  : `${filteredRiders.length} of ${riders.length} riders`}
              </Text>
            ) : null}

            {riders.length === 0 ? (
              <View style={styles.empty}>
                <Users color={Colors.textLight} size={28} />
                <Text style={styles.emptyText}>No riders yet</Text>
              </View>
            ) : filteredRiders.length === 0 ? (
              <View style={styles.empty}>
                <Search color={Colors.textLight} size={28} />
                <Text style={styles.emptyText}>No riders match “{riderSearch.trim()}”</Text>
                <TouchableOpacity onPress={() => setRiderSearch('')} style={styles.clearSearchBtn}>
                  <Text style={styles.clearSearchText}>Clear search</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredRiders.map((r) => (
                <View key={r.id} style={[styles.card, r.blocked && styles.cardBlocked]}>
                  <View style={styles.cardTop}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {(r.name || 'R')
                          .split(' ')
                          .map((p) => p[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{r.name || 'Rider'}</Text>
                      <Text style={styles.meta}>
                        {r.phone ? `+91 ${r.phone}` : r.id.slice(0, 12)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusPill,
                        r.blocked ? styles.statusBad : styles.statusOk,
                      ]}
                    >
                      <Text style={styles.statusText}>{r.blocked ? 'Blocked' : 'Active'}</Text>
                    </View>
                  </View>

                  <View style={styles.statRow}>
                    <View style={styles.statCell}>
                      <Car color={Colors.primary} size={14} />
                      <Text style={styles.statNum}>{r.totalRides}</Text>
                      <Text style={styles.statLbl}>Rides</Text>
                    </View>
                    <View style={styles.statCell}>
                      <CheckCircle2 color={Colors.success} size={14} />
                      <Text style={styles.statNum}>{r.completedRides}</Text>
                      <Text style={styles.statLbl}>Done</Text>
                    </View>
                    <View style={styles.statCell}>
                      <ThumbsUp color={Colors.success} size={14} />
                      <Text style={[styles.statNum, { color: Colors.success }]}>
                        {r.goodReviews}
                      </Text>
                      <Text style={styles.statLbl}>Good</Text>
                    </View>
                    <View style={styles.statCell}>
                      <ThumbsDown color={Colors.error} size={14} />
                      <Text style={[styles.statNum, { color: Colors.error }]}>
                        {r.badReviews}
                      </Text>
                      <Text style={styles.statLbl}>Bad</Text>
                    </View>
                  </View>

                  <View style={styles.reviewBar}>
                    <Star color={Colors.accent} size={14} fill={Colors.accent} />
                    <Text style={styles.reviewText}>
                      {r.avgRating != null
                        ? `${r.avgRating} avg · ${r.reviewCount} reviews`
                        : 'No reviews yet'}
                    </Text>
                  </View>

                  {r.blocked && r.blockReason ? (
                    <Text style={styles.blockReason}>Reason: {r.blockReason}</Text>
                  ) : null}

                  <View style={styles.actions}>
                    {r.blocked ? (
                      <TouchableOpacity
                        style={[styles.btn, styles.btnOk]}
                        onPress={() => onBlockRider(r, false)}
                        disabled={busyId === r.id}
                      >
                        <Text style={styles.btnText}>
                          {busyId === r.id ? '…' : 'Unblock rider'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.btn, styles.btnBad]}
                        onPress={() => onBlockRider(r, true)}
                        disabled={busyId === r.id}
                      >
                        <Ban color="#fff" size={14} />
                        <Text style={styles.btnText}>
                          {busyId === r.id ? '…' : 'Block rider'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}

            {blockId ? (
              <View style={styles.rejectBox}>
                <Text style={styles.sectionTitle}>Block reason</Text>
                <TextInput
                  style={styles.input}
                  value={blockReason}
                  onChangeText={setBlockReason}
                  placeholder="e.g. Abusive behaviour / fake bookings"
                  placeholderTextColor={Colors.textLight}
                />
                <View style={styles.actions}>
                  <TouchableOpacity style={[styles.btn, styles.btnBad]} onPress={confirmBlock}>
                    <Text style={styles.btnText}>Confirm block</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnGhost]}
                    onPress={() => setBlockId(null)}
                  >
                    <Text style={[styles.btnText, { color: Colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* ——— WITHDRAW TAB ——— */}
        {tab === 'withdraw' && !loading ? (
          <View>
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>Weekly withdrawal window</Text>
                  <Text style={styles.meta}>
                    {weeklyOpen ? 'OPEN — drivers can request' : 'CLOSED — drivers cannot withdraw'}
                  </Text>
                  <Text style={[styles.meta, { marginBottom: 4 }]}>{weeklyNote}</Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    weeklyOpen ? styles.statusOk : styles.statusPend,
                  ]}
                >
                  <Text style={styles.statusText}>{weeklyOpen ? 'Open' : 'Closed'}</Text>
                </View>
              </View>
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
                <Wallet color={Colors.textLight} size={28} />
                <Text style={styles.emptyText}>No withdrawals yet</Text>
              </View>
            ) : (
              withdrawals.map((w) => (
                <View key={w.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>
                        {w.driverName} · ₹{w.amount}
                      </Text>
                      <Text style={styles.meta}>
                        {w.loginId} · {w.upiId}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusPill,
                        w.status === 'paid' && styles.statusOk,
                        w.status === 'rejected' && styles.statusBad,
                        w.status === 'pending_admin' && styles.statusPend,
                      ]}
                    >
                      <Text style={styles.statusText}>{w.status}</Text>
                    </View>
                  </View>
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

        {/* ——— KYC TAB ——— */}
        {tab === 'kyc' && !loading ? (
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

            {drivers.length === 0 ? (
              <View style={styles.empty}>
                <Car color={Colors.textLight} size={28} />
                <Text style={styles.emptyText}>No {filter} applications</Text>
              </View>
            ) : null}

            {drivers.map((d) => (
              <View key={d.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(d.name || 'D')
                        .split(' ')
                        .map((p) => p[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </Text>
                  </View>
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
                  <Text style={styles.docLine}>
                    RC: {d.documents?.rcNumber || d.vehicle?.registrationNumber}
                  </Text>
                  <Text style={styles.docLine}>
                    Aadhaar:{' '}
                    {d.documents?.aadhaarNumber
                      ? `XXXX${String(d.documents.aadhaarNumber).slice(-4)}`
                      : '—'}
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
                  <TouchableOpacity
                    style={[styles.btn, styles.btnOutline]}
                    onPress={() => onApprove(d)}
                  >
                    <Text style={[styles.btnText, { color: Colors.success }]}>
                      Show credentials again
                    </Text>
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
                    style={[styles.btn, styles.btnGhost]}
                    onPress={() => setRejectId(null)}
                  >
                    <Text style={[styles.btnText, { color: Colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </>
        ) : null}

        <TouchableOpacity style={styles.refresh} onPress={load}>
          <RefreshCw color={Colors.primary} size={16} />
          <Text style={styles.refreshText}>Refresh data</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F2ED' },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === 'web' ? 24 : 50,
    paddingHorizontal: 20,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexShrink: 1,
  },
  headerBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(201,162,93,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(201,162,93,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { flexShrink: 1 },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: 1.4,
    marginBottom: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(217,119,87,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    gap: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    position: 'relative',
  },
  tabItemOn: {},
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  tabTextOn: {
    color: Colors.white,
    fontWeight: '800',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '18%',
    right: '18%',
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  content: { padding: 20, paddingBottom: 56 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: Colors.white,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E4DC',
    marginBottom: 10,
  },
  metricTop: {
    marginBottom: 10,
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: { fontSize: 24, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  metricTitle: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
    fontWeight: '600',
  },
  secondaryMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  secondaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E8E4DC',
  },
  secondaryValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
  },
  secondaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textLight,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 6 },
  sectionHint: { fontSize: 12, color: Colors.textLight, marginBottom: 12, fontWeight: '500' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8E4DC',
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
  },
  resultCount: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textLight,
    marginBottom: 10,
  },
  clearSearchBtn: { marginTop: 4, paddingVertical: 6 },
  clearSearchText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: {
    paddingHorizontal: 14,
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
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8E4DC',
    shadowColor: '#1B2A4A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardBlocked: {
    borderColor: '#F5C6C0',
    backgroundColor: '#FFF8F7',
  },
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.accent, fontWeight: '800', fontSize: 14 },
  name: { fontSize: 16, fontWeight: '800', color: Colors.text },
  meta: { fontSize: 12, color: Colors.textLight, marginTop: 2, fontWeight: '600' },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusOk: { backgroundColor: '#E8F5E9' },
  statusBad: { backgroundColor: '#FFEBEE' },
  statusPend: { backgroundColor: '#FFF8E1' },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: Colors.text,
  },
  statRow: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EDE6',
    gap: 6,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FAF8F4',
    borderRadius: 12,
    paddingVertical: 10,
  },
  statNum: { fontSize: 16, fontWeight: '800', color: Colors.text },
  statLbl: { fontSize: 10, fontWeight: '700', color: Colors.textLight },
  reviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  reviewText: { fontSize: 12, fontWeight: '600', color: Colors.textLight },
  blockReason: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.error,
    fontWeight: '600',
  },
  docBlock: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EDE6',
    gap: 4,
  },
  docLine: { fontSize: 13, color: Colors.text, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
  btn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  btnOk: { backgroundColor: Colors.success },
  btnBad: { backgroundColor: Colors.error },
  btnGhost: { backgroundColor: '#EFEBE3' },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.success,
    marginTop: 12,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  empty: {
    backgroundColor: Colors.white,
    padding: 32,
    borderRadius: 18,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#EFEBE3',
  },
  emptyText: { color: Colors.textLight, fontWeight: '600' },
  errorBox: {
    backgroundColor: '#FDECEA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  error: { color: Colors.error, fontWeight: '700', fontSize: 13 },
  rejectBox: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 18,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#EFEBE3',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E8E4DC',
    backgroundColor: '#FAF8F4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    color: Colors.text,
    fontWeight: '600',
  },
  credBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  credTitle: { fontWeight: '800', color: Colors.success, marginBottom: 6 },
  credLine: { fontSize: 14, fontWeight: '700', color: Colors.text, marginTop: 2 },
  credHint: { fontSize: 11, color: Colors.textLight, marginTop: 8 },
  refresh: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  refreshText: { color: Colors.primary, fontWeight: '700' },
});
