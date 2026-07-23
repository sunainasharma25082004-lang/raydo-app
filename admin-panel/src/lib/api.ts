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
  vehicle: {
    type: string;
    registrationNumber: string;
    model?: string;
    color?: string;
    year?: string;
  };
  documents: Record<string, string | undefined>;
  approvedAt?: string;
};

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

  stats: (token: string) =>
    request<Record<string, number>>('/api/kyc/admin/stats', { token }),

  approve: (token: string, id: string) =>
    request<{
      message: string;
      driver: AdminDriver;
      credentials: { loginId: string; password: string; note: string };
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
};
