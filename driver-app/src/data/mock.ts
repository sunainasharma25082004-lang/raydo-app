export type TripStatus =
  | 'idle'
  | 'incoming'
  | 'to_pickup'
  | 'waiting'
  | 'in_trip'
  | 'completed';

export type VehicleKind = 'Bike' | 'Scooty' | 'Auto' | 'Car' | 'Cab';

export type RideRequest = {
  id: string;
  riderName: string;
  riderRating: number;
  pickup: string;
  pickupArea: string;
  drop: string;
  dropArea: string;
  distanceKm: number;
  etaMin: number;
  fare: number;
  payment: 'Cash' | 'UPI' | 'Card';
  vehicle: VehicleKind;
  /** Distance from driver GPS to pickup (nearest match) */
  distanceFromDriverKm?: number | null;
  riderPhone?: string;
  isLiveServerRide?: boolean;
};

export type HistoryTrip = {
  id: string;
  date: string;
  time: string;
  pickup: string;
  drop: string;
  fare: number;
  distanceKm: number;
  rating: number;
  payment: string;
};

export type EarningDay = {
  day: string;
  amount: number;
};

export const DRIVER = {
  name: 'Amit Kumar',
  phone: '+91 98765 43210',
  vehicle: 'KA 01 AB 4521',
  vehicleType: 'Auto · Bajaj RE',
  vehicleCategory: 'Auto' as VehicleKind,
  rating: 4.86,
  trips: 1284,
  years: 3,
  city: 'Bengaluru',
};

/** Scooty/Bike share two-wheeler group; Auto alone; Car/Cab alone */
export function vehicleGroup(type?: string | null): 'two_wheeler' | 'auto' | 'car' | 'other' {
  const t = String(type || '').toLowerCase();
  if (t === 'bike' || t === 'scooty' || t === 'scooter' || t === 'two-wheeler') return 'two_wheeler';
  if (t === 'auto' || t === 'auto-rickshaw' || t === 'erickshaw' || t === 'e-rickshaw') return 'auto';
  if (t === 'car' || t === 'cab' || t === 'sedan' || t === 'suv') return 'car';
  return 'other';
}

export function vehiclesMatch(driverType?: string | null, requestType?: string | null) {
  return vehicleGroup(driverType) === vehicleGroup(requestType);
}

export const SAMPLE_REQUESTS: RideRequest[] = [
  {
    id: 'req-1',
    riderName: 'Priya S.',
    riderRating: 4.9,
    pickup: 'Indiranagar Metro Station',
    pickupArea: '100 Feet Rd, Indiranagar',
    drop: 'Phoenix Marketcity',
    dropArea: 'Whitefield Main Rd',
    distanceKm: 12.4,
    etaMin: 8,
    fare: 245,
    payment: 'UPI',
    vehicle: 'Auto',
  },
  {
    id: 'req-2',
    riderName: 'Rohan M.',
    riderRating: 4.7,
    pickup: 'Koramangala 5th Block',
    pickupArea: '80 Feet Rd',
    drop: 'MG Road Metro',
    dropArea: 'MG Road',
    distanceKm: 6.2,
    etaMin: 5,
    fare: 128,
    payment: 'Cash',
    vehicle: 'Auto',
  },
  {
    id: 'req-3',
    riderName: 'Ananya K.',
    riderRating: 4.95,
    pickup: 'HSR Layout Sector 2',
    pickupArea: '27th Main',
    drop: 'Kempegowda Airport T1',
    dropArea: 'Devanahalli',
    distanceKm: 38.5,
    etaMin: 18,
    fare: 780,
    payment: 'Card',
    vehicle: 'Car',
  },
  {
    id: 'req-4',
    riderName: 'Vikram T.',
    riderRating: 4.8,
    pickup: 'BTM 2nd Stage',
    pickupArea: '16th Main',
    drop: 'Jayanagar 4th Block',
    dropArea: 'South End Circle',
    distanceKm: 4.1,
    etaMin: 4,
    fare: 55,
    payment: 'UPI',
    vehicle: 'Scooty',
  },
  {
    id: 'req-5',
    riderName: 'Sneha R.',
    riderRating: 4.6,
    pickup: 'Marathahalli Bridge',
    pickupArea: 'ORR',
    drop: 'Bellandur',
    dropArea: 'Sarjapur Rd',
    distanceKm: 5.5,
    etaMin: 6,
    fare: 62,
    payment: 'Cash',
    vehicle: 'Bike',
  },
];

export const INITIAL_HISTORY: HistoryTrip[] = [
  {
    id: 'h1',
    date: 'Today',
    time: '09:42 AM',
    pickup: 'Jayanagar 4th Block',
    drop: 'Lalbagh West Gate',
    fare: 95,
    distanceKm: 3.8,
    rating: 5,
    payment: 'UPI',
  },
  {
    id: 'h2',
    date: 'Today',
    time: '08:15 AM',
    pickup: 'BTM Layout',
    drop: 'Silk Board',
    fare: 72,
    distanceKm: 2.9,
    rating: 4,
    payment: 'Cash',
  },
  {
    id: 'h3',
    date: 'Yesterday',
    time: '07:20 PM',
    pickup: 'Whitefield',
    drop: 'Marathahalli Bridge',
    fare: 168,
    distanceKm: 7.1,
    rating: 5,
    payment: 'UPI',
  },
];

export const WEEKLY_EARNINGS: EarningDay[] = [
  { day: 'Mon', amount: 1240 },
  { day: 'Tue', amount: 980 },
  { day: 'Wed', amount: 1560 },
  { day: 'Thu', amount: 1320 },
  { day: 'Fri', amount: 1890 },
  { day: 'Sat', amount: 2140 },
  { day: 'Sun', amount: 1670 },
];

export function formatInr(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function pickRandomRequest(driverVehicleType?: string | null): RideRequest | null {
  const pool = SAMPLE_REQUESTS.filter((r) =>
    driverVehicleType ? vehiclesMatch(driverVehicleType, r.vehicle) : true,
  );
  if (!pool.length) return null;
  const base = pool[Math.floor(Math.random() * pool.length)];
  return {
    ...base,
    id: `req-${Date.now()}`,
    fare: base.fare + Math.floor(Math.random() * 40) - 10,
  };
}
