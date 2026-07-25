import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  DRIVER,
  HistoryTrip,
  INITIAL_HISTORY,
  RideRequest,
  TripStatus,
  pickRandomRequest,
} from '@/data/mock';
import { useSession } from '@/context/SessionContext';
import { api } from '@/lib/api';

type DriverProfileView = {
  name: string;
  phone: string;
  vehicle: string;
  vehicleType: string;
  vehicleCategory: string;
  rating: number;
  trips: number;
  years: number;
  city: string;
  loginId?: string | null;
  kycStatus?: string;
};

type DriverContextValue = {
  driver: DriverProfileView;
  isOnline: boolean;
  setOnline: (value: boolean) => void;
  tripStatus: TripStatus;
  activeRequest: RideRequest | null;
  todayEarnings: number;
  todayTrips: number;
  history: HistoryTrip[];
  simulateIncoming: () => void;
  acceptRequest: () => void;
  rejectRequest: () => void;
  arrivedAtPickup: () => void;
  startTrip: () => void;
  completeTrip: (rating?: number, rideOverride?: Partial<RideRequest> | null) => void;
  resetToIdle: () => void;
  /** Sync server ride into local active request (accept flow → trip) */
  setActiveFromServerRide: (ride: {
    id: string;
    riderName?: string;
    pickup?: string;
    drop?: string;
    fare?: number;
    distanceKm?: number;
    vehicleType?: string;
    distanceKmFromDriver?: number | null;
    riderPhone?: string;
  }) => void;
  /** Show polished incoming request UI (notification modal) */
  presentIncomingRide: (ride: {
    id: string;
    riderName?: string;
    pickup?: string;
    drop?: string;
    fare?: number;
    distanceKm?: number;
    vehicleType?: string;
    distanceKmFromDriver?: number | null;
    riderPhone?: string;
  }) => boolean;
  lastCompleted: HistoryTrip | null;
};

const DriverContext = createContext<DriverContextValue | null>(null);

/** Run after current render/commit so parent state never updates mid-render. */
function defer(fn: () => void) {
  setTimeout(fn, 0);
}

export function DriverProvider({ children }: { children: React.ReactNode }) {
  const { driver: sessionDriver, token, updateDriver } = useSession();
  const [isOnline, setIsOnline] = useState(false);
  const [tripStatus, setTripStatus] = useState<TripStatus>('idle');
  const [activeRequest, setActiveRequest] = useState<RideRequest | null>(null);
  const [todayEarnings, setTodayEarnings] = useState(167);
  const [todayTrips, setTodayTrips] = useState(2);
  const [history, setHistory] = useState<HistoryTrip[]>(INITIAL_HISTORY);
  const [lastCompleted, setLastCompleted] = useState<HistoryTrip | null>(null);

  const autoRequestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tripStatusRef = useRef<TripStatus>(tripStatus);
  const isOnlineRef = useRef(isOnline);
  const activeRequestRef = useRef(activeRequest);
  const vehicleCategoryRef = useRef('Auto');

  tripStatusRef.current = tripStatus;
  isOnlineRef.current = isOnline;
  activeRequestRef.current = activeRequest;

  const driver: DriverProfileView = useMemo(() => {
    if (!sessionDriver) {
      vehicleCategoryRef.current = DRIVER.vehicleCategory || 'Auto';
      return { ...DRIVER };
    }
    const category = sessionDriver.vehicle?.type || 'Auto';
    vehicleCategoryRef.current = category;
    return {
      name: sessionDriver.name,
      phone: `+91 ${sessionDriver.phone}`,
      vehicle: sessionDriver.vehicle?.registrationNumber || '—',
      vehicleType: `${sessionDriver.vehicle?.type || '—'}${
        sessionDriver.vehicle?.model ? ` · ${sessionDriver.vehicle.model}` : ''
      }`,
      vehicleCategory: category,
      rating: sessionDriver.rating ?? 5,
      trips: sessionDriver.totalRides ?? 0,
      years: sessionDriver.years ?? 0,
      city: sessionDriver.city || 'Bengaluru',
      loginId: sessionDriver.loginId,
      kycStatus: sessionDriver.kycStatus,
    };
  }, [sessionDriver]);

  const clearAutoTimer = useCallback(() => {
    if (autoRequestTimer.current) {
      clearTimeout(autoRequestTimer.current);
      autoRequestTimer.current = null;
    }
  }, []);

  const setOnline = useCallback(
    (value: boolean) => {
      setIsOnline(value);
      clearAutoTimer();

      if (token) {
        api
          .setOnline(token, value)
          .then((res) => updateDriver(res.driver))
          .catch(() => {});
      }

      if (!value) {
        if (tripStatusRef.current === 'incoming') {
          defer(() => {
            setTripStatus('idle');
            setActiveRequest(null);
          });
        }
        return;
      }

      // Real logged-in drivers: NO fake demo requests (only server open-rides of same vehicle).
      // Demo mock only when offline login / no token.
      if (!token && tripStatusRef.current === 'idle') {
        autoRequestTimer.current = setTimeout(() => {
          if (!isOnlineRef.current || tripStatusRef.current !== 'idle') return;
          const req = pickRandomRequest(vehicleCategoryRef.current);
          if (!req) return;
          setActiveRequest(req);
          setTripStatus('incoming');
        }, 3500);
      }
    },
    [token, updateDriver, clearAutoTimer],
  );

  const simulateIncoming = useCallback(() => {
    if (!isOnlineRef.current || tripStatusRef.current !== 'idle') return;
    // Logged-in: never inject fake cross-vehicle junk
    if (token) return;
    clearAutoTimer();
    const req = pickRandomRequest(vehicleCategoryRef.current);
    if (!req) return;
    setActiveRequest(req);
    setTripStatus('incoming');
  }, [clearAutoTimer, token]);

  const acceptRequest = useCallback(() => {
    if (!activeRequestRef.current) return;
    clearAutoTimer();
    // Defer so this never runs during RequestCard render/timer setState
    defer(() => {
      setTripStatus('to_pickup');
    });
  }, [clearAutoTimer]);

  const rejectRequest = useCallback(() => {
    clearAutoTimer();
    // Always defer — fixes "Cannot update component while rendering another"
    defer(() => {
      setActiveRequest(null);
      setTripStatus('idle');
    });
  }, [clearAutoTimer]);

  const arrivedAtPickup = useCallback(() => {
    setTripStatus('waiting');
  }, []);

  const startTrip = useCallback(() => {
    setTripStatus('in_trip');
  }, []);

  const rideToRequest = (ride: {
    id: string;
    riderName?: string;
    pickup?: string;
    drop?: string;
    fare?: number;
    distanceKm?: number;
    vehicleType?: string;
    distanceKmFromDriver?: number | null;
    riderPhone?: string;
  }): RideRequest => ({
    id: ride.id,
    riderName: ride.riderName || 'Rider',
    riderRating: 5,
    pickup: ride.pickup || 'Pickup',
    pickupArea: ride.pickup || '',
    drop: ride.drop || 'Drop',
    dropArea: ride.drop || '',
    distanceKm: Number(ride.distanceKm) || 0,
    etaMin: Math.max(
      1,
      Math.ceil(
        ((Number(ride.distanceKmFromDriver) || Number(ride.distanceKm) || 3) / 22) * 60,
      ),
    ),
    fare: Number(ride.fare) || 0,
    payment: 'UPI',
    vehicle: (ride.vehicleType as RideRequest['vehicle']) || 'Auto',
    distanceFromDriverKm:
      ride.distanceKmFromDriver != null ? Number(ride.distanceKmFromDriver) : null,
    riderPhone: ride.riderPhone,
    isLiveServerRide: true,
  });

  const setActiveFromServerRide = useCallback(
    (ride: {
      id: string;
      riderName?: string;
      pickup?: string;
      drop?: string;
      fare?: number;
      distanceKm?: number;
      vehicleType?: string;
      distanceKmFromDriver?: number | null;
      riderPhone?: string;
    }) => {
      setActiveRequest(rideToRequest(ride));
      setTripStatus('to_pickup');
    },
    [],
  );

  /** Queue a server ride as incoming popup (returns false if driver busy) */
  const presentIncomingRide = useCallback(
    (ride: {
      id: string;
      riderName?: string;
      pickup?: string;
      drop?: string;
      fare?: number;
      distanceKm?: number;
      vehicleType?: string;
      distanceKmFromDriver?: number | null;
      riderPhone?: string;
    }) => {
      if (tripStatusRef.current !== 'idle') return false;
      if (!isOnlineRef.current) return false;
      // Same ride already showing
      if (activeRequestRef.current?.id === ride.id) return false;
      setActiveRequest(rideToRequest(ride));
      setTripStatus('incoming');
      return true;
    },
    [],
  );

  const completeTrip = useCallback((rating = 5, rideOverride?: Partial<RideRequest> | null) => {
    const req = activeRequestRef.current;
    const fare = Number(rideOverride?.fare ?? req?.fare ?? 0);
    const pickup = String(rideOverride?.pickup ?? req?.pickup ?? 'Pickup');
    const drop = String(rideOverride?.drop ?? req?.drop ?? 'Drop');
    const distanceKm = Number(rideOverride?.distanceKm ?? req?.distanceKm ?? 0);
    const payment = (rideOverride?.payment as string) || req?.payment || 'UPI';
    const now = new Date();
    const time = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const entry: HistoryTrip = {
      id: `h-${Date.now()}`,
      date: 'Today',
      time,
      pickup,
      drop,
      fare,
      distanceKm,
      rating,
      payment,
    };
    setHistory((prev) => [entry, ...prev]);
    setLastCompleted(entry);
    if (fare > 0) {
      setTodayEarnings((v) => v + fare);
      setTodayTrips((v) => v + 1);
    }
    setTripStatus('completed');
  }, []);

  const resetToIdle = useCallback(() => {
    setActiveRequest(null);
    setTripStatus('idle');
  }, []);

  const value = useMemo(
    () => ({
      driver,
      isOnline,
      setOnline,
      tripStatus,
      activeRequest,
      todayEarnings,
      todayTrips,
      history,
      lastCompleted,
      simulateIncoming,
      acceptRequest,
      rejectRequest,
      arrivedAtPickup,
      setActiveFromServerRide,
      presentIncomingRide,
      startTrip,
      completeTrip,
      resetToIdle,
    }),
    [
      driver,
      isOnline,
      setOnline,
      tripStatus,
      activeRequest,
      todayEarnings,
      todayTrips,
      history,
      lastCompleted,
      simulateIncoming,
      acceptRequest,
      rejectRequest,
      arrivedAtPickup,
      setActiveFromServerRide,
      presentIncomingRide,
      startTrip,
      completeTrip,
      resetToIdle,
    ],
  );

  return <DriverContext.Provider value={value}>{children}</DriverContext.Provider>;
}

export function useDriver() {
  const ctx = useContext(DriverContext);
  if (!ctx) {
    throw new Error('useDriver must be used inside DriverProvider');
  }
  return ctx;
}
