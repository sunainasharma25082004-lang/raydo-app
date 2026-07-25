import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Expo Go (SDK 53+) throws if expo-notifications is imported on Android.
 * Use a development build for real push; in Expo Go we no-op safely.
 */
const isExpoGo = Constants.appOwnership === 'expo';

type NotificationsModule = typeof import('expo-notifications');

let Notifications: NotificationsModule | null = null;
let loadAttempted = false;
let configured = false;

function getNotifications(): NotificationsModule | null {
  if (isExpoGo) return null;
  if (loadAttempted) return Notifications;
  loadAttempted = true;
  try {
    // Lazy require — never top-level import (crashes Expo Go)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require('expo-notifications') as NotificationsModule;
  } catch (e) {
    console.warn('[Notifications] unavailable in this runtime', e);
    Notifications = null;
  }
  return Notifications;
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

export async function notifyDriverAssigned(opts: {
  driverName: string;
  etaMinutes?: number | null;
  vehicle?: string;
}) {
  try {
    const N = getNotifications();
    if (!N) {
      // Expo Go fallback — console only (UI still works)
      console.log(
        '[Notify]',
        `Driver on the way: ${opts.driverName}`,
        opts.etaMinutes != null ? `ETA ~${opts.etaMinutes}m` : '',
      );
      return;
    }
    const ok = await setupRiderNotifications();
    if (!ok) return;

    const eta = opts.etaMinutes != null ? ` · ETA ~${opts.etaMinutes} min` : '';
    await N.scheduleNotificationAsync({
      content: {
        title: 'Driver is on the way 🚗',
        body: `${opts.driverName}${opts.vehicle ? ` · ${opts.vehicle}` : ''}${eta}`,
        sound: true,
        data: { type: 'driver_assigned' },
        ...(Platform.OS === 'android' ? { channelId: 'rides' } : {}),
      },
      trigger: null,
    });
  } catch (e) {
    console.warn('[Notifications] assign notify failed', e);
  }
}

export async function notifyRider(title: string, body: string) {
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
        ...(Platform.OS === 'android' ? { channelId: 'rides' } : {}),
      },
      trigger: null,
    });
  } catch {
    /* ignore */
  }
}
