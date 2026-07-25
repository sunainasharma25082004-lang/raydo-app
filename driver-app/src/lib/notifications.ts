import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Expo Go (SDK 53+) throws if expo-notifications is imported on Android.
 * Development builds support full notifications; Expo Go no-ops safely.
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

/**
 * Local notifications for driver (ride request, chat, trip).
 * Real push needs a dev/production build + EAS credentials.
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

export async function notifyRideRequest(opts: {
  riderName: string;
  fare: number;
  pickup: string;
  vehicle?: string;
  distanceKm?: number | null;
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
      // Expo Go: still show in-app request card; log only
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
        data: { type: 'ride_request' },
        ...(Platform.OS === 'android' ? { channelId: 'rides' } : {}),
      },
      trigger: null,
    });
  } catch (e) {
    console.warn('[Notifications] ride request notify failed', e);
  }
}

export async function notifyTripUpdate(title: string, body: string) {
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
        data: { type: 'trip' },
        ...(Platform.OS === 'android' ? { channelId: 'general' } : {}),
      },
      trigger: null,
    });
  } catch (e) {
    console.warn('[Notifications] trip notify failed', e);
  }
}
