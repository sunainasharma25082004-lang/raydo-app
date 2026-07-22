export { API_BASE, SOCKET_URL } from '@/lib/config';
import { API_BASE } from '@/lib/config';

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

export type VehicleType = 'Bike' | 'Scooty' | 'Auto' | 'Car';

export type DriverProfile = {
  id: string;
  phone: string;
  name: string;
  email?: string;
  city?: string;
  loginId?: string | null;
  kycStatus: 'draft' | 'pending' | 'approved' | 'rejected';
  kycRejectionReason?: string;
  vehicle: {
    type: VehicleType;
    registrationNumber: string;
    model?: string;
    color?: string;
    year?: string;
  };
  documents: Record<string, string | undefined>;
  isOnline?: boolean;
  rating?: number;
  totalRides?: number;
  years?: number;
  walletBalance?: number;
  lifetimeEarnings?: number;
  location?: { lat: number; lng: number; updatedAt?: string } | null;
  tempPassword?: string;
};

export type LiveRide = {
  id: string;
  riderId: string;
  riderName: string;
  riderPhone?: string;
  pickup: string;
  drop: string;
  pickupLat: number;
  pickupLng: number;
  dropLat?: number | null;
  dropLng?: number | null;
  vehicleType: string;
  fare: number;
  distanceKm: number;
  status: string;
  driverId?: string | null;
  driverSnapshot?: any;
  driverLocation?: { lat: number; lng: number; updatedAt?: string } | null;
  riderLocation?: { lat: number; lng: number; updatedAt?: string } | null;
  otp?: string;
  createdAt?: string;
};

export type KycPayload = {
  phone: string;
  name: string;
  email?: string;
  city?: string;
  vehicle: {
    type: VehicleType;
    registrationNumber: string;
    model?: string;
    color?: string;
    year?: string;
  };
  documents: {
    licenseNumber: string;
    rcNumber?: string;
    aadhaarNumber?: string;
    insuranceNumber?: string;
  };
};

export const api = {
  applyKyc: (body: KycPayload) =>
    request<{ message: string; driver: DriverProfile }>('/api/kyc/apply', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  kycStatus: (q: { phone?: string; loginId?: string; id?: string }) => {
    const params = new URLSearchParams();
    if (q.phone) params.set('phone', q.phone);
    if (q.loginId) params.set('loginId', q.loginId);
    if (q.id) params.set('id', q.id);
    return request<{ driver: DriverProfile }>(`/api/kyc/status?${params}`);
  },

  driverLogin: (loginId: string, password: string) =>
    request<{ message: string; token: string; driver: DriverProfile }>('/api/drivers/login', {
      method: 'POST',
      body: JSON.stringify({ loginId, password }),
    }),

  me: (token: string) => request<{ driver: DriverProfile }>('/api/drivers/me', { token }),

  setOnline: (token: string, isOnline: boolean, lat?: number, lng?: number) =>
    request<{ driver: DriverProfile }>('/api/drivers/online', {
      method: 'POST',
      token,
      body: JSON.stringify({ isOnline, lat, lng }),
    }),

  pushLocation: (
    token: string,
    lat: number,
    lng: number,
    opts?: { isOnline?: boolean; rideId?: string },
  ) =>
    request<{ driver: DriverProfile; ride?: LiveRide }>('/api/platform/driver/location', {
      method: 'POST',
      token,
      body: JSON.stringify({ lat, lng, isOnline: opts?.isOnline, rideId: opts?.rideId }),
    }),

  openRides: (token: string) =>
    request<{ rides: LiveRide[] }>('/api/platform/driver/open-rides', { token }),

  activeRide: (token: string) =>
    request<{ ride: LiveRide | null }>('/api/platform/driver/active-ride', { token }),

  acceptRide: (token: string, rideId: string) =>
    request<{ ride: LiveRide }>(`/api/platform/rides/${rideId}/accept`, {
      method: 'POST',
      token,
      body: '{}',
    }),

  updateRideStatus: (token: string, rideId: string, status: string, otp?: string) =>
    request<{ ride: LiveRide }>(`/api/platform/rides/${rideId}/status`, {
      method: 'POST',
      token,
      body: JSON.stringify({ status, otp }),
    }),

  getRide: (rideId: string) => request<{ ride: LiveRide }>(`/api/platform/rides/${rideId}`),

  wallet: (token: string) =>
    request<{
      walletBalance: number;
      lifetimeEarnings: number;
      totalRides: number;
      completedTrips: number;
      withdrawals: any[];
      weeklyWithdrawOpen: boolean;
      weeklyWithdrawNote: string;
    }>('/api/platform/driver/wallet', { token }),

  withdraw: (token: string, amount: number, upiId: string) =>
    request<{ message: string; withdrawal: any }>('/api/platform/driver/withdraw', {
      method: 'POST',
      token,
      body: JSON.stringify({ amount, upiId }),
    }),
};
