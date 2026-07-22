export { API_BASE, SOCKET_URL } from '@/lib/config';
import { API_BASE } from '@/lib/config';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data as T;
}

export type LiveRide = {
  id: string;
  riderId: string;
  riderName: string;
  pickup: string;
  drop: string;
  pickupLat: number;
  pickupLng: number;
  vehicleType: string;
  fare: number;
  distanceKm: number;
  status: string;
  driverId?: string | null;
  driverSnapshot?: {
    id: string;
    name: string;
    phone: string;
    rating?: number;
    vehicle?: { type: string; registrationNumber: string; model?: string };
    location?: { lat: number; lng: number } | null;
  } | null;
  driverLocation?: { lat: number; lng: number; updatedAt?: string } | null;
  otp?: string;
};

export const riderApi = {
  createRide: (body: {
    riderId?: string;
    riderName?: string;
    riderPhone?: string;
    pickup: string;
    drop: string;
    pickupLat: number;
    pickupLng: number;
    dropLat?: number;
    dropLng?: number;
    vehicleType: string;
    fare?: number;
    distanceKm?: number;
  }) =>
    request<{
      ride: LiveRide;
      matchedDriversCount: number;
      matchedDrivers: any[];
    }>('/api/platform/rides', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getRide: (id: string) => request<{ ride: LiveRide }>(`/api/platform/rides/${id}`),

  cancelRide: (id: string) =>
    request<{ ride: LiveRide }>(`/api/platform/rides/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ by: 'rider' }),
    }),

  pushRiderLocation: (rideId: string, lat: number, lng: number) =>
    request('/api/platform/rides/rider-location', {
      method: 'POST',
      body: JSON.stringify({ rideId, lat, lng }),
    }),

  /** Live Geoapify APIs via backend */
  mapHealth: () =>
    request<{ ok: boolean; configured: boolean; sample?: string; message?: string }>(
      '/api/map/health',
    ),

  reverseGeocode: (lat: number, lng: number) =>
    request<{ formatted?: string | null; features?: any[] }>(
      `/api/map/reverse-geocode?lat=${lat}&lon=${lng}`,
    ),

  autocomplete: (text: string, biasLat?: number, biasLng?: number) => {
    const params = new URLSearchParams({ text });
    if (biasLat != null && biasLng != null) {
      params.set('bias', `proximity:${biasLng},${biasLat}`);
    }
    return request<{
      suggestions: {
        id: string;
        label: string;
        name: string;
        city: string;
        lat: number;
        lng: number;
      }[];
    }>(`/api/map/autocomplete?${params}`);
  },

  routing: (fromLat: number, fromLng: number, toLat: number, toLng: number, mode = 'drive') => {
    // Geoapify waypoints format: lat,lon|lat,lon
    const waypoints = `${fromLat},${fromLng}|${toLat},${toLng}`;
    return request<{
      features?: {
        properties?: { distance?: number; time?: number };
        geometry?: { coordinates?: number[][][] };
      }[];
    }>(`/api/map/routing?waypoints=${encodeURIComponent(waypoints)}&mode=${mode}`);
  },
};
