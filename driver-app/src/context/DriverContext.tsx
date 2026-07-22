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
  completeTrip: (rating?: number) => void;
  resetToIdle: () => void;
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

      // Schedule a demo request only when idle
      if (tripStatusRef.current === 'idle') {
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
    clearAutoTimer();
    const req = pickRandomRequest(vehicleCategoryRef.current);
    if (!req) return;
    setActiveRequest(req);
    setTripStatus('incoming');
  }, [clearAutoTimer]);

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

  const completeTrip = useCallback(
    (rating = 5) => {
      const req = activeRequestRef.current;
      if (!req) return;
      const now = new Date();
      const time = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const entry: HistoryTrip = {
        id: `h-${Date.now()}`,
        date: 'Today',
        time,
        pickup: req.pickup,
        drop: req.drop,
        fare: req.fare,
        distanceKm: req.distanceKm,
        rating,
        payment: req.payment,
      };
      setHistory((prev) => [entry, ...prev]);
      setTodayEarnings((v) => v + req.fare);
      setTodayTrips((v) => v + 1);
      setTripStatus('completed');
    },
    [],
  );

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
      simulateIncoming,
      acceptRequest,
      rejectRequest,
      arrivedAtPickup,
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
      simulateIncoming,
      acceptRequest,
      rejectRequest,
      arrivedAtPickup,
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
