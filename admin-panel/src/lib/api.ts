/**
 * Production API (Render). Override with EXPO_PUBLIC_API_URL for local backend.
 */
export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL || 'https://raydo-app-tqev.onrender.com';

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data as T;
}

export type AdminDriver = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  loginId?: string | null;
  tempPassword?: string;
  kycStatus: string;
  kycRejectionReason?: string;
  kycSubmittedAt?: string;
  createdAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  vehicle: {
    type: string;
    registrationNumber: string;
    model?: string;
    color?: string;
    year?: string;
  };
  documents: Record<string, string | undefined>;
  isOnline?: boolean;
  rating?: number;
  totalRides?: number;
};

/** Resolve KYC doc image path to a loadable URI */
export function docImageUri(path?: string | null): string | null {
  if (!path) return null;
  const p = String(path).trim();
  if (!p) return null;
  if (p.startsWith('data:') || p.startsWith('http://') || p.startsWith('https://')) return p;
  if (p.startsWith('/')) return `${API_BASE}${p}`;
  return `${API_BASE}/${p}`;
}

export type AdminRider = {
  id: string;
  name: string;
  phone: string;
  blocked: boolean;
  blockReason?: string;
  blockedAt?: string | null;
  blockedBy?: string | null;
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  activeRides: number;
  reviewCount: number;
  goodReviews: number;
  badReviews: number;
  neutralReviews: number;
  avgRating: number | null;
  lastRideAt?: string | null;
  createdAt?: string;
};

export const adminApi = {
  login: (username: string, password: string) =>
    request<{ token: string; admin: { username: string; name: string } }>('/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  list: (token: string, status = 'pending') =>
    request<{ drivers: AdminDriver[]; stats: Record<string, number> }>(
      `/api/kyc/admin/list?status=${status}`,
      { token },
    ),

  getDriver: (token: string, id: string) =>
    request<{ driver: AdminDriver }>(`/api/kyc/admin/${id}`, { token }),

  stats: (token: string) =>
    request<Record<string, number>>('/api/kyc/admin/stats', { token }),

  approve: (token: string, id: string) =>
    request<{
      message: string;
      driver: AdminDriver;
      credentials: { loginId: string; password: string; note: string };
      credentialsNotify?: {
        sent?: boolean;
        channel?: string;
        to?: string | null;
        reason?: string | null;
        waMeLink?: string | null;
      };
    }>(`/api/kyc/admin/${id}/approve`, { method: 'POST', token, body: '{}' }),

  reject: (token: string, id: string, reason: string) =>
    request<{ message: string; driver: AdminDriver }>(`/api/kyc/admin/${id}/reject`, {
      method: 'POST',
      token,
      body: JSON.stringify({ reason }),
    }),

  platformStats: (token: string) =>
    request<Record<string, number | boolean>>('/api/platform/admin/stats', { token }),

  withdrawals: (token: string, status = 'pending_admin') =>
    request<{
      withdrawals: any[];
      settings: { weeklyWithdrawOpen: boolean; weeklyWithdrawNote: string };
    }>(`/api/platform/admin/withdrawals?status=${status}`, { token }),

  decideWithdraw: (token: string, id: string, decision: 'approve' | 'reject', note?: string) =>
    request(`/api/platform/admin/withdrawals/${id}/decide`, {
      method: 'POST',
      token,
      body: JSON.stringify({ decision, note }),
    }),

  setWeeklyWindow: (token: string, open: boolean, note?: string) =>
    request('/api/platform/admin/weekly-withdraw', {
      method: 'POST',
      token,
      body: JSON.stringify({ open, note }),
    }),

  riders: (token: string, status: 'all' | 'active' | 'blocked' = 'all') =>
    request<{ riders: AdminRider[]; stats: Record<string, number> }>(
      `/api/platform/admin/riders?status=${status}`,
      { token },
    ),

  blockRider: (token: string, id: string, blocked: boolean, reason?: string) =>
    request<{ message: string; rider: AdminRider }>(`/api/platform/admin/riders/${id}/block`, {
      method: 'POST',
      token,
      body: JSON.stringify({ blocked, reason }),
    }),

  /** All ride payments collected by admin/platform */
  payments: (token: string, status = 'all') =>
    request<{
      payments: AdminPayment[];
      stats: {
        totalPayments: number;
        receivedCount: number;
        pendingCount: number;
        totalReceived: number;
        totalPending: number;
        platformBalance: number;
      };
    }>(`/api/platform/admin/payments?status=${status}`, { token }),
};

export type AdminPayment = {
  id: string;
  rideId: string;
  amount: number;
  currency?: string;
  destination: string;
  status: string;
  method?: string;
  riderName?: string;
  riderPhone?: string;
  driverName?: string;
  driverLoginId?: string;
  vehicleType?: string;
  pickup?: string;
  drop?: string;
  createdAt?: string;
  paidAt?: string | null;
  transactionId?: string;
};
