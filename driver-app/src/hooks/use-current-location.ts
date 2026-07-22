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
  const watch = options?.watch ?? true;
  const highAccuracy = options?.highAccuracy ?? true;
  const [coords, setCoords] = useState<Coords | null>(null);
  const [address, setAddress] = useState('Detecting location…');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<Location.PermissionStatus | null>(null);
  const subRef = useRef<Location.LocationSubscription | null>(null);

  const reverse = useCallback(async (latitude: number, longitude: number) => {
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
          'Enable GPS / Location so riders can find you nearby.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open settings', onPress: () => Linking.openSettings() },
          ],
        );
        return false;
      }

      const current = await Location.getForegroundPermissionsAsync();
      setPermission(current.status);
      if (current.status === Location.PermissionStatus.GRANTED) return true;

      const asked = await Location.requestForegroundPermissionsAsync();
      setPermission(asked.status);
      if (asked.status !== Location.PermissionStatus.GRANTED) {
        setError('Location permission denied. Enable it in Settings.');
        Alert.alert(
          'Location permission needed',
          'Driver app needs your live location to receive nearby ride requests.',
          [
            { text: 'Not now', style: 'cancel' },
            { text: 'Open settings', onPress: () => Linking.openSettings() },
          ],
        );
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
      const ok = await requestPermission();
      if (!ok) {
        setLoading(false);
        setAddress('Location permission required');
        return;
      }

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
        try {
          await Location.enableNetworkProviderAsync();
        } catch {
          /* dismissed */
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
