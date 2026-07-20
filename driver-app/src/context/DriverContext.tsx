import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
  DRIVER,
  HistoryTrip,
  INITIAL_HISTORY,
  RideRequest,
  TripStatus,
  pickRandomRequest,
} from '@/data/mock';

type DriverContextValue = {
  driver: typeof DRIVER;
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

export function DriverProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(false);
  const [tripStatus, setTripStatus] = useState<TripStatus>('idle');
  const [activeRequest, setActiveRequest] = useState<RideRequest | null>(null);
  const [todayEarnings, setTodayEarnings] = useState(167);
  const [todayTrips, setTodayTrips] = useState(2);
  const [history, setHistory] = useState<HistoryTrip[]>(INITIAL_HISTORY);
  const autoRequestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoTimer = () => {
    if (autoRequestTimer.current) {
      clearTimeout(autoRequestTimer.current);
      autoRequestTimer.current = null;
    }
  };

  const setOnline = useCallback((value: boolean) => {
    setIsOnline(value);
    clearAutoTimer();
    if (!value) {
      if (tripStatus === 'incoming') {
        setTripStatus('idle');
        setActiveRequest(null);
      }
      return;
    }
    // Demo: first request shortly after going online
    if (tripStatus === 'idle') {
      autoRequestTimer.current = setTimeout(() => {
        setActiveRequest(pickRandomRequest());
        setTripStatus('incoming');
      }, 3500);
    }
  }, [tripStatus]);

  const simulateIncoming = useCallback(() => {
    if (!isOnline || tripStatus !== 'idle') return;
    clearAutoTimer();
    setActiveRequest(pickRandomRequest());
    setTripStatus('incoming');
  }, [isOnline, tripStatus]);

  const acceptRequest = useCallback(() => {
    if (!activeRequest) return;
    clearAutoTimer();
    setTripStatus('to_pickup');
  }, [activeRequest]);

  const rejectRequest = useCallback(() => {
    clearAutoTimer();
    setActiveRequest(null);
    setTripStatus('idle');
  }, []);

  const arrivedAtPickup = useCallback(() => {
    setTripStatus('waiting');
  }, []);

  const startTrip = useCallback(() => {
    setTripStatus('in_trip');
  }, []);

  const completeTrip = useCallback(
    (rating = 5) => {
      if (!activeRequest) return;
      const now = new Date();
      const time = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const entry: HistoryTrip = {
        id: `h-${Date.now()}`,
        date: 'Today',
        time,
        pickup: activeRequest.pickup,
        drop: activeRequest.drop,
        fare: activeRequest.fare,
        distanceKm: activeRequest.distanceKm,
        rating,
        payment: activeRequest.payment,
      };
      setHistory((prev) => [entry, ...prev]);
      setTodayEarnings((v) => v + activeRequest.fare);
      setTodayTrips((v) => v + 1);
      setTripStatus('completed');
    },
    [activeRequest]
  );

  const resetToIdle = useCallback(() => {
    setActiveRequest(null);
    setTripStatus('idle');
  }, []);

  const value = useMemo(
    () => ({
      driver: DRIVER,
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
    ]
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
