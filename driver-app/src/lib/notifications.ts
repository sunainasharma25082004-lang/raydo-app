import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';

/**
 * Expo Go (SDK 53+) cannot use expo-notifications on Android.
 * Dev/production builds get full local notifications + tap → open screen.
 */
const isExpoGo = Constants.appOwnership === 'expo';

type NotificationsModule = typeof import('expo-notifications');

let Notifications: NotificationsModule | null = null;
let loadAttempted = false;
let configured = false;
let responseSub: { remove: () => void } | null = null;

export type NotifyPayload = {
  type: string;
  href?: string;
  rideId?: string;
  riderName?: string;
  [key: string]: unknown;
};

function getNotifications(): NotificationsModule | null {
  if (isExpoGo) return null;
  if (loadAttempted) return Notifications;
  loadAttempted = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require('expo-notifications') as NotificationsModule;
  } catch (e) {
    console.warn('[Notifications] unavailable in this runtime', e);
    Notifications = null;
  }
  return Notifications;
}

export function isNotificationsSupported() {
  return !isExpoGo && !!getNotifications();
}

/**
 * Local notifications for driver (ride request, chat, trip).
 */
export async function setupDriverNotifications() {
  const N = getNotifications();
  if (!N) return false;
  if (configured) return true;
  configured = true;

  try {
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    const { status: existing } = await N.getPermissionsAsync();
    let final = existing;
    if (existing !== 'granted') {
      const asked = await N.requestPermissionsAsync();
      final = asked.status;
    }
    if (final !== 'granted') {
      console.warn('[Notifications] permission not granted');
      return false;
    }

    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync('rides', {
        name: 'Ride requests',
        importance: N.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 120, 250],
        lightColor: '#C9A25D',
        sound: 'default',
        enableVibrate: true,
      });
      await N.setNotificationChannelAsync('general', {
        name: 'General',
        importance: N.AndroidImportance.DEFAULT,
        sound: 'default',
      });
    }
    return true;
  } catch (e) {
    console.warn('[Notifications] setup failed', e);
    return false;
  }
}

/**
 * When user taps a notification → open the right screen.
 * Call once from root layout.
 */
export function registerDriverNotificationTapHandler(router: any) {
  const N = getNotifications();
  if (!N) return () => {};

  // Clean previous sub if any
  try {
    responseSub?.remove();
  } catch {
    /* ignore */
  }

  const openFromData = (data: NotifyPayload | undefined | null) => {
    if (!data || typeof data !== 'object') {
      router.push('/driver/(tabs)/home' as any);
      return;
    }
    const href = String(data.href || '');
    const type = String(data.type || '');

    // Prefer explicit href
    if (href.startsWith('/')) {
      router.push(href as any);
      return;
    }

    if (type === 'ride_request') {
      router.push('/driver/request' as any);
      return;
    }
    if (type === 'trip' || type === 'ride_accepted') {
      router.push('/driver/trip' as any);
      return;
    }
    if (type === 'chat' && data.rideId) {
      router.push({
        pathname: '/driver/chat' as any,
        params: {
          rideId: String(data.rideId),
          riderName: String(data.riderName || 'Rider'),
        },
      });
      return;
    }
    router.push('/driver/(tabs)/home' as any);
  };

  responseSub = N.addNotificationResponseReceivedListener((response) => {
    try {
      const data = response?.notification?.request?.content?.data as NotifyPayload;
      // Small delay so navigation tree is ready after cold start
      setTimeout(() => openFromData(data), 300);
    } catch (e) {
      console.warn('[Notifications] tap handler failed', e);
    }
  });

  // App opened from killed state by tapping notification
  N.getLastNotificationResponseAsync?.()
    .then((last) => {
      if (!last) return;
      const data = last.notification?.request?.content?.data as NotifyPayload;
      setTimeout(() => openFromData(data), 500);
    })
    .catch(() => {});

  return () => {
    try {
      responseSub?.remove();
      responseSub = null;
    } catch {
      /* ignore */
    }
  };
}

export async function notifyRideRequest(opts: {
  riderName: string;
  fare: number;
  pickup: string;
  vehicle?: string;
  distanceKm?: number | null;
  rideId?: string;
}) {
  try {
    const N = getNotifications();
    const dist =
      opts.distanceKm != null && Number.isFinite(Number(opts.distanceKm))
        ? ` · ${Number(opts.distanceKm).toFixed(1)} km away`
        : '';
    const title = '🚗 New ride request';
    const body = `${opts.riderName} · ₹${opts.fare}${dist}\n${opts.pickup}${
      opts.vehicle ? ` · ${opts.vehicle}` : ''
    }`;

    if (!N) {
      console.log('[Notify]', title, body);
      return;
    }

    const ok = await setupDriverNotifications();
    if (!ok) return;

    await N.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: {
          type: 'ride_request',
          href: '/driver/request',
          rideId: opts.rideId || '',
          riderName: opts.riderName,
        } satisfies NotifyPayload,
        ...(Platform.OS === 'android' ? { channelId: 'rides' } : {}),
      },
      trigger: null,
    });
  } catch (e) {
    console.warn('[Notifications] ride request notify failed', e);
  }
}

export async function notifyTripUpdate(
  title: string,
  body: string,
  data?: Partial<NotifyPayload>,
) {
  try {
    const N = getNotifications();
    if (!N) {
      console.log('[Notify]', title, body);
      return;
    }
    const ok = await setupDriverNotifications();
    if (!ok) return;
    await N.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: {
          type: data?.type || 'trip',
          href: data?.href || '/driver/trip',
          rideId: data?.rideId || '',
          ...data,
        } as NotifyPayload,
        ...(Platform.OS === 'android' ? { channelId: 'general' } : {}),
      },
      trigger: null,
    });
  } catch (e) {
    console.warn('[Notifications] trip notify failed', e);
  }
}
