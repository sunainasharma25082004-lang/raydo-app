import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking, type AppStateStatus } from 'react-native';
import * as Location from 'expo-location';

export type Coords = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
};

export type LocationState = {
  coords: Coords | null;
  address: string;
  loading: boolean;
  error: string | null;
  permission: Location.PermissionStatus | null;
  refresh: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
};

function formatAddress(parts: Location.LocationGeocodedAddress[]): string {
  if (!parts?.length) return '';
  const a = parts[0];
  const bits = [
    a.name,
    a.streetNumber && a.street ? `${a.streetNumber} ${a.street}` : a.street,
    a.district,
    a.city,
    a.region,
  ].filter(Boolean);
  const unique: string[] = [];
  for (const b of bits) {
    if (!unique.includes(String(b))) unique.push(String(b));
  }
  return unique.slice(0, 4).join(', ') || a.formattedAddress || 'Current location';
}

/** Ask permission only — safe to call from login (no MapView). */
export async function askLocationPermission(): Promise<boolean> {
  try {
    const servicesOn = await Location.hasServicesEnabledAsync();
    if (!servicesOn) return false;

    let current = await Location.getForegroundPermissionsAsync();
    if (current.status !== Location.PermissionStatus.GRANTED) {
      current = await Location.requestForegroundPermissionsAsync();
    }
    return current.status === Location.PermissionStatus.GRANTED;
  } catch {
    return false;
  }
}

export function useCurrentLocation(options?: {
  watch?: boolean;
  highAccuracy?: boolean;
  /**
   * false = never auto-prompt on mount (recommended on home with MapView).
   * true = auto fetch after delay if already granted, or prompt.
   */
  autoStart?: boolean;
  /** Only read GPS if permission already granted — never show system dialog on mount. */
  onlyIfGranted?: boolean;
  startDelayMs?: number;
}): LocationState {
  const watch = options?.watch ?? false;
  const highAccuracy = options?.highAccuracy ?? false;
  const autoStart = options?.autoStart ?? true;
  const onlyIfGranted = options?.onlyIfGranted ?? false;
  const startDelayMs = options?.startDelayMs ?? 1200;

  const [coords, setCoords] = useState<Coords | null>(null);
  const [address, setAddress] = useState(
    onlyIfGranted || !autoStart ? 'Enable location for pickup' : 'Detecting location…',
  );
  const [loading, setLoading] = useState(!!autoStart);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<Location.PermissionStatus | null>(null);
  const subRef = useRef<Location.LocationSubscription | null>(null);
  const startedRef = useRef(false);

  const reverse = useCallback(async (latitude: number, longitude: number) => {
    try {
      const { API_BASE } = await import('@/lib/config');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(
        `${API_BASE}/api/map/reverse-geocode?lat=${latitude}&lon=${longitude}`,
        { signal: controller.signal },
      );
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.formatted) {
          setAddress(data.formatted);
          return;
        }
      }
    } catch {
      /* fall through */
    }

    try {
      const places = await Location.reverseGeocodeAsync({ latitude, longitude });
      const label = formatAddress(places);
      if (label) setAddress(label);
      else setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
    } catch {
      setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
    }
  }, []);

  const applyPosition = useCallback(
    async (loc: Location.LocationObject) => {
      const next: Coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
      };
      setCoords(next);
      setError(null);
      // reverse geocode is non-critical — don't block UI / crash path
      reverse(next.latitude, next.longitude).catch(() => {});
    },
    [reverse],
  );

  const requestPermission = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    try {
      const servicesOn = await Location.hasServicesEnabledAsync();
      if (!servicesOn) {
        setError('Location services are turned off on this device.');
        setPermission(Location.PermissionStatus.DENIED);
        if (!silent) {
          Alert.alert(
            'Turn on location',
            'Please enable Location / GPS in your phone settings for Raydo.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open settings', onPress: () => Linking.openSettings() },
            ],
          );
        }
        return false;
      }

      let current = await Location.getForegroundPermissionsAsync();
      setPermission(current.status);

      if (current.status !== Location.PermissionStatus.GRANTED) {
        const asked = await Location.requestForegroundPermissionsAsync();
        current = asked;
        setPermission(asked.status);
      }

      if (current.status !== Location.PermissionStatus.GRANTED) {
        setError('Location permission denied. Enable it in Settings.');
        if (!silent) {
          Alert.alert(
            'Location permission needed',
            'Raydo needs your live location to show the map and set pickup.',
            [
              { text: 'Not now', style: 'cancel' },
              { text: 'Open settings', onPress: () => Linking.openSettings() },
            ],
          );
        }
        return false;
      }

      return true;
    } catch (e: any) {
      setError(e?.message || 'Could not request location permission');
      return false;
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // If onlyIfGranted and user hasn't allowed yet, don't open system dialog here
      // unless this was an explicit user action — refresh() is used for both.
      const existing = await Location.getForegroundPermissionsAsync();
      setPermission(existing.status);

      let ok = existing.status === Location.PermissionStatus.GRANTED;
      if (!ok) {
        ok = await requestPermission({ silent: false });
      }
      if (!ok) {
        setLoading(false);
        setAddress('Location permission required');
        return;
      }

      try {
        const last = await Location.getLastKnownPositionAsync({
          maxAge: 120_000,
          requiredAccuracy: 500,
        });
        if (last) {
          await applyPosition(last);
          setLoading(false);
        }
      } catch {
        /* optional */
      }

      // Low accuracy first — much less likely to crash / hang on MIUI
      const current = await Location.getCurrentPositionAsync({
        accuracy: highAccuracy ? Location.Accuracy.Balanced : Location.Accuracy.Low,
        mayShowUserSettingsDialog: false,
      });
      await applyPosition(current);
    } catch (e: any) {
      // Never rethrow — crash must not leave the app
      setError(e?.message || 'Unable to get GPS location');
      setAddress('Unable to get GPS location');
    } finally {
      setLoading(false);
    }
  }, [applyPosition, highAccuracy, requestPermission]);

  const startWatch = useCallback(async () => {
    if (!watch) return;
    try {
      const existing = await Location.getForegroundPermissionsAsync();
      if (existing.status !== Location.PermissionStatus.GRANTED) return;

      subRef.current?.remove();
      subRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Low,
          timeInterval: 8000,
          distanceInterval: 20,
          mayShowUserSettingsDialog: false,
        },
        (loc) => {
          applyPosition(loc);
        },
      );
    } catch {
      /* best-effort */
    }
  }, [applyPosition, watch]);

  useEffect(() => {
    if (!autoStart) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const boot = async () => {
      if (startedRef.current || cancelled) return;
      startedRef.current = true;

      try {
        const existing = await Location.getForegroundPermissionsAsync();
        setPermission(existing.status);

        if (existing.status !== Location.PermissionStatus.GRANTED) {
          if (onlyIfGranted) {
            // Never prompt while MapView is on screen — user taps Retry
            setLoading(false);
            setAddress('Tap to enable location');
            setError(null);
            return;
          }
        }

        await refresh();
        if (!cancelled) await startWatch();
      } catch {
        if (!cancelled) {
          setLoading(false);
          setError('Location unavailable');
        }
      }
    };

    const schedule = () => {
      if (AppState.currentState !== 'active') return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        boot();
      }, startDelayMs);
    };

    schedule();

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active' && !startedRef.current) {
        schedule();
      }
    };
    const sub = AppState.addEventListener('change', onAppState);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      sub.remove();
      subRef.current?.remove();
      subRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, onlyIfGranted, watch, highAccuracy, startDelayMs]);

  return {
    coords,
    address,
    loading,
    error,
    permission,
    refresh,
    requestPermission: () => requestPermission({ silent: false }),
  };
}
