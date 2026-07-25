import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';

/**
 * Expo Go (SDK 53+) cannot use expo-notifications on Android.
 * Dev builds: local notifications + tap opens the right screen.
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

export async function setupRiderNotifications() {
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
    if (final !== 'granted') return false;

    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync('rides', {
        name: 'Ride updates',
        importance: N.AndroidImportance.MAX,
        vibrationPattern: [0, 200, 100, 200],
        lightColor: '#C9A25D',
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
 * Tap on notification → open tracking / chat / home.
 * Call once from root layout.
 */
export function registerRiderNotificationTapHandler(router: any) {
  const N = getNotifications();
  if (!N) return () => {};

  try {
    responseSub?.remove();
  } catch {
    /* ignore */
  }

  const openFromData = (data: NotifyPayload | undefined | null) => {
    if (!data || typeof data !== 'object') {
      router.push('/(tabs)/home' as any);
      return;
    }
    const href = String(data.href || '');
    const type = String(data.type || '');
    const rideId = data.rideId ? String(data.rideId) : '';

    if (href.startsWith('/')) {
      if (rideId && href.includes('tracking')) {
        router.push({ pathname: href as any, params: { rideId } });
      } else if (rideId && href.includes('chat')) {
        router.push({
          pathname: '/rider/chat' as any,
          params: { rideId, riderId: String(data.riderId || ''), driverName: String(data.driverName || 'Driver') },
        });
      } else {
        router.push(href as any);
      }
      return;
    }

    if (type === 'driver_assigned' || type === 'ride_update') {
      if (rideId) {
        router.push({
          pathname: '/rider/tracking' as any,
          params: { rideId },
        });
      } else {
        router.push('/(tabs)/home' as any);
      }
      return;
    }
    if (type === 'chat' && rideId) {
      router.push({
        pathname: '/rider/chat' as any,
        params: {
          rideId,
          riderId: String(data.riderId || ''),
          driverName: String(data.driverName || 'Driver'),
        },
      });
      return;
    }
    router.push('/(tabs)/home' as any);
  };

  responseSub = N.addNotificationResponseReceivedListener((response) => {
    try {
      const data = response?.notification?.request?.content?.data as NotifyPayload;
      setTimeout(() => openFromData(data), 300);
    } catch (e) {
      console.warn('[Notifications] tap handler failed', e);
    }
  });

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

export async function notifyDriverAssigned(opts: {
  driverName: string;
  etaMinutes?: number | null;
  vehicle?: string;
  rideId?: string;
}) {
  try {
    const N = getNotifications();
    const eta = opts.etaMinutes != null ? ` · ETA ~${opts.etaMinutes} min` : '';
    const title = 'Driver is on the way 🚗';
    const body = `${opts.driverName}${opts.vehicle ? ` · ${opts.vehicle}` : ''}${eta}`;

    if (!N) {
      console.log('[Notify]', title, body);
      return;
    }
    const ok = await setupRiderNotifications();
    if (!ok) return;

    await N.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: {
          type: 'driver_assigned',
          href: '/rider/tracking',
          rideId: opts.rideId || '',
          driverName: opts.driverName,
        } satisfies NotifyPayload,
        ...(Platform.OS === 'android' ? { channelId: 'rides' } : {}),
      },
      trigger: null,
    });
  } catch (e) {
    console.warn('[Notifications] assign notify failed', e);
  }
}

export async function notifyRider(
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
    const ok = await setupRiderNotifications();
    if (!ok) return;
    await N.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: {
          type: data?.type || 'ride_update',
          href: data?.href || '/(tabs)/home',
          rideId: data?.rideId || '',
          ...data,
        } as NotifyPayload,
        ...(Platform.OS === 'android' ? { channelId: 'rides' } : {}),
      },
      trigger: null,
    });
  } catch {
    /* ignore */
  }
}
