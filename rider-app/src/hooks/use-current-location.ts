import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
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
  // Deduplicate consecutive same strings
  const unique: string[] = [];
  for (const b of bits) {
    if (!unique.includes(String(b))) unique.push(String(b));
  }
  return unique.slice(0, 4).join(', ') || a.formattedAddress || 'Current location';
}

export function useCurrentLocation(options?: {
  watch?: boolean;
  highAccuracy?: boolean;
}): LocationState {
  const watch = options?.watch ?? false;
  const highAccuracy = options?.highAccuracy ?? true;
  const [coords, setCoords] = useState<Coords | null>(null);
  const [address, setAddress] = useState('Detecting location…');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<Location.PermissionStatus | null>(null);
  const subRef = useRef<Location.LocationSubscription | null>(null);

  const reverse = useCallback(async (latitude: number, longitude: number) => {
    // 1) Prefer live Geoapify via backend (real map API key)
    try {
      const { API_BASE } = await import('@/lib/config');
      const res = await fetch(
        `${API_BASE}/api/map/reverse-geocode?lat=${latitude}&lon=${longitude}`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data.formatted) {
          setAddress(data.formatted);
          return;
        }
      }
    } catch {
      /* fall through to device reverse geocode */
    }

    // 2) Fallback: device OS reverse geocode
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
      await reverse(next.latitude, next.longitude);
    },
    [reverse],
  );

  const requestPermission = useCallback(async () => {
    try {
      const servicesOn = await Location.hasServicesEnabledAsync();
      if (!servicesOn) {
        setError('Location services are turned off on this device.');
        setPermission(Location.PermissionStatus.DENIED);
        Alert.alert(
          'Turn on location',
          'Please enable Location / GPS in your phone settings for Raydo.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open settings', onPress: () => Linking.openSettings() },
          ],
        );
        return false;
      }

      // Always re-check; on Android Expo Go users often need a second prompt
      let current = await Location.getForegroundPermissionsAsync();
      setPermission(current.status);

      if (current.status !== Location.PermissionStatus.GRANTED) {
        const asked = await Location.requestForegroundPermissionsAsync();
        current = asked;
        setPermission(asked.status);
      }

      if (current.status !== Location.PermissionStatus.GRANTED) {
        setError('Location permission denied. Enable it in Settings.');
        Alert.alert(
          'Location permission needed',
          'Raydo needs your live location to show the map and set pickup.',
          [
            { text: 'Not now', style: 'cancel' },
            { text: 'Open settings', onPress: () => Linking.openSettings() },
          ],
        );
        return false;
      }

      // Prefer fine accuracy when available (Android)
      if (Platform.OS === 'android') {
        try {
          await Location.enableNetworkProviderAsync();
        } catch {
          /* user dismissed high-accuracy dialog */
        }
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
      const ok = await requestPermission();
      if (!ok) {
        setLoading(false);
        setAddress('Location permission required');
        return;
      }

      // Prefer last known for speed, then precise fix
      const last = await Location.getLastKnownPositionAsync({
        maxAge: 60_000,
        requiredAccuracy: 200,
      });
      if (last) {
        await applyPosition(last);
        setLoading(false);
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
        mayShowUserSettingsDialog: true,
      });
      await applyPosition(current);
    } catch (e: any) {
      setError(e?.message || 'Unable to get GPS location');
      setAddress('Unable to get GPS location');
      if (Platform.OS === 'android') {
        // Ask user to improve accuracy (GPS + network)
        try {
          await Location.enableNetworkProviderAsync();
        } catch {
          /* user dismissed */
        }
      }
    } finally {
      setLoading(false);
    }
  }, [applyPosition, highAccuracy, requestPermission]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await refresh();
      if (cancelled || !watch) return;

      const ok = await requestPermission();
      if (!ok || cancelled) return;

      subRef.current = await Location.watchPositionAsync(
        {
          accuracy: highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
          timeInterval: 4000,
          distanceInterval: 8,
          mayShowUserSettingsDialog: true,
        },
        (loc) => {
          if (!cancelled) applyPosition(loc);
        },
      );
    })();

    return () => {
      cancelled = true;
      subRef.current?.remove();
      subRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch, highAccuracy]);

  return {
    coords,
    address,
    loading,
    error,
    permission,
    refresh,
    requestPermission,
  };
}
