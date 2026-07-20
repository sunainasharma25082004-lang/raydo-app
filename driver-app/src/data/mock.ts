export type TripStatus =
  | 'idle'
  | 'incoming'
  | 'to_pickup'
  | 'waiting'
  | 'in_trip'
  | 'completed';

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
  vehicle: 'Auto' | 'Cab' | 'Bike';
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
  rating: 4.86,
  trips: 1284,
  years: 3,
  city: 'Bengaluru',
};

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
    vehicle: 'Cab',
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
  {
    id: 'h4',
    date: 'Yesterday',
    time: '02:05 PM',
    pickup: 'Electronic City',
    drop: 'Bommanahalli',
    fare: 210,
    distanceKm: 9.4,
    rating: 5,
    payment: 'Card',
  },
  {
    id: 'h5',
    date: 'Jul 16',
    time: '11:30 AM',
    pickup: 'Hebbal Flyover',
    drop: 'Manyata Tech Park',
    fare: 142,
    distanceKm: 5.6,
    rating: 4,
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

export function pickRandomRequest(): RideRequest {
  const base = SAMPLE_REQUESTS[Math.floor(Math.random() * SAMPLE_REQUESTS.length)];
  return {
    ...base,
    id: `req-${Date.now()}`,
    fare: base.fare + Math.floor(Math.random() * 40) - 10,
  };
}
