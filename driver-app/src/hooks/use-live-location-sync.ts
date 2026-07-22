import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { io, Socket } from 'socket.io-client';
import { api, SOCKET_URL } from '@/lib/api';
import { useSession } from '@/context/SessionContext';

/**
 * Streams real GPS to backend + socket so the rider map updates live.
 */
export function useLiveLocationSync(opts: {
  enabled: boolean;
  rideId?: string | null;
  isOnline?: boolean;
}) {
  const { token, driver } = useSession();
  const subRef = useRef<Location.LocationSubscription | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const rideIdRef = useRef(opts.rideId);
  const onlineRef = useRef(opts.isOnline);
  rideIdRef.current = opts.rideId;
  onlineRef.current = opts.isOnline;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!opts.enabled || !token || !driver?.id) return;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;

      // Socket for instant rider updates
      const socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
      });
      socketRef.current = socket;
      socket.emit('join_driver', driver.id);
      if (opts.rideId) socket.emit('join_ride', opts.rideId);

      const push = async (lat: number, lng: number) => {
        if (cancelled || !token) return;
        const rideId = rideIdRef.current || undefined;
        const isOnline = onlineRef.current;

        // HTTP persist
        api
          .pushLocation(token, lat, lng, { isOnline, rideId })
          .catch(() => {});

        // Socket realtime → rider
        socket.emit('driver_update_location', {
          driverId: driver.id,
          lat,
          lng,
          isOnline,
          rideId,
        });
        socket.emit('trip_location_update', {
          rideId,
          driverId: driver.id,
          lat,
          lng,
        });
      };

      try {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          mayShowUserSettingsDialog: true,
        });
        if (!cancelled) await push(pos.coords.latitude, pos.coords.longitude);
      } catch {
        /* first fix optional */
      }

      subRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2500,
          distanceInterval: 5,
          mayShowUserSettingsDialog: true,
        },
        (loc) => {
          push(loc.coords.latitude, loc.coords.longitude);
        },
      );
    })();

    return () => {
      cancelled = true;
      subRef.current?.remove();
      subRef.current = null;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [opts.enabled, opts.rideId, token, driver?.id]);
}
