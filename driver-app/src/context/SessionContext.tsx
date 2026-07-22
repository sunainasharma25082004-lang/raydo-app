import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { api, DriverProfile } from '@/lib/api';

type SessionValue = {
  token: string | null;
  driver: DriverProfile | null;
  setSession: (token: string, driver: DriverProfile) => void;
  clearSession: () => void;
  refreshDriver: () => Promise<void>;
  updateDriver: (driver: DriverProfile) => void;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [driver, setDriver] = useState<DriverProfile | null>(null);

  const setSession = useCallback((t: string, d: DriverProfile) => {
    setToken(t);
    setDriver(d);
  }, []);

  const clearSession = useCallback(() => {
    setToken(null);
    setDriver(null);
  }, []);

  const updateDriver = useCallback((d: DriverProfile) => setDriver(d), []);

  const refreshDriver = useCallback(async () => {
    if (!token) return;
    const res = await api.me(token);
    setDriver(res.driver);
  }, [token]);

  const value = useMemo(
    () => ({ token, driver, setSession, clearSession, refreshDriver, updateDriver }),
    [token, driver, setSession, clearSession, refreshDriver, updateDriver],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
