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

export type NearbyDriver = {
  id: string;
  name: string;
  phone?: string;
  rating?: number;
  vehicle?: { type: string; registrationNumber?: string; model?: string };
  location?: { lat: number; lng: number; updatedAt?: string } | null;
  distanceKm?: number;
  isOnline?: boolean;
};

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
  matchedDriversSnapshot?: NearbyDriver[];
  matchedDriverIds?: string[];
  matchRadiusKm?: number;
  chatEnabled?: boolean;
  pickupEtaMinutes?: number | null;
  pickupDistanceKm?: number | null;
  whatsappNotify?: {
    sent?: boolean;
    channel?: string;
    message?: string;
    waMeLink?: string | null;
  };
  otp?: string;
  riderPhone?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  paymentId?: string;
  paymentDestination?: string;
};

export type ChatMessage = {
  id: string;
  rideId?: string;
  senderRole: 'rider' | 'driver' | string;
  senderId?: string;
  text: string;
  message?: string;
  createdAt?: string;
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
      matchedDrivers: NearbyDriver[];
      matchRule?: {
        vehicle?: string;
        maxDrivers?: number;
        radiusKm?: number;
        sort?: string;
      };
      message?: string;
    }>('/api/platform/rides', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /** Preview up to 10 nearest online drivers near lat/lng */
  nearbyDrivers: (vehicleType: string, lat: number, lng: number) =>
    request<{
      count: number;
      radiusKm: number;
      maxDrivers: number;
      drivers: NearbyDriver[];
    }>(
      `/api/match/drivers?vehicleType=${encodeURIComponent(vehicleType)}&lat=${lat}&lng=${lng}`,
    ),

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

  /** Places near rider GPS (home "Nearby places") */
  nearbyPlaces: (lat: number, lng: number, radiusMeters = 2500) =>
    request<{
      ok: boolean;
      count: number;
      places: {
        id: string;
        name: string;
        address: string;
        lat: number;
        lng: number;
        distanceM: number | null;
        distanceKm: number | null;
        emoji: string;
        categories?: string[];
      }[];
    }>(
      `/api/map/nearby-places?lat=${lat}&lon=${lng}&radiusMeters=${radiusMeters}&limit=12`,
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

  getChat: (rideId: string) =>
    request<{ rideId: string; chatEnabled: boolean; status: string; messages: ChatMessage[] }>(
      `/api/platform/rides/${rideId}/chat`,
    ),

  sendChat: (
    rideId: string,
    body: { text: string; senderRole: 'rider' | 'driver'; senderId?: string },
  ) =>
    request<{ message: string; msg: ChatMessage; chatEnabled: boolean }>(
      `/api/platform/rides/${rideId}/chat`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    ),

  /** Pay after trip complete — amount goes to admin/platform */
  payRide: (
    rideId: string,
    body?: { method?: string; rating?: number; comment?: string; transactionId?: string },
  ) =>
    request<{
      message: string;
      payment: {
        id: string;
        amount: number;
        status: string;
        destination: string;
        method?: string;
      };
      ride: LiveRide;
      platformBalance?: number;
      alreadyPaid?: boolean;
    }>(`/api/platform/rides/${rideId}/pay`, {
      method: 'POST',
      body: JSON.stringify(body || { method: 'upi' }),
    }),
};
