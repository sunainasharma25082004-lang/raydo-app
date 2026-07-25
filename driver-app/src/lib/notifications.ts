import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

let configured = false;

/**
 * Local notifications for driver (ride request, chat, trip).
 * Works in Expo Go with local notifications; remote push needs EAS credentials.
 */
export async function setupDriverNotifications() {
  if (configured) return;
  configured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let final = existing;
    if (existing !== 'granted') {
      const asked = await Notifications.requestPermissionsAsync();
      final = asked.status;
    }
    if (final !== 'granted') {
      console.warn('[Notifications] permission not granted');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('rides', {
        name: 'Ride requests',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 120, 250],
        lightColor: '#C9A25D',
        sound: 'default',
        enableVibrate: true,
      });
      await Notifications.setNotificationChannelAsync('general', {
        name: 'General',
        importance: Notifications.AndroidImportance.DEFAULT,
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
    await setupDriverNotifications();
    const dist =
      opts.distanceKm != null && Number.isFinite(Number(opts.distanceKm))
        ? ` · ${Number(opts.distanceKm).toFixed(1)} km away`
        : '';
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚗 New ride request',
        body: `${opts.riderName} · ₹${opts.fare}${dist}\n${opts.pickup}${
          opts.vehicle ? ` · ${opts.vehicle}` : ''
        }`,
        sound: true,
        data: { type: 'ride_request' },
        ...(Platform.OS === 'android' ? { channelId: 'rides' } : {}),
      },
      trigger: null, // immediate
    });
  } catch (e) {
    console.warn('[Notifications] ride request notify failed', e);
  }
}

export async function notifyTripUpdate(title: string, body: string) {
  try {
    await setupDriverNotifications();
    await Notifications.scheduleNotificationAsync({
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
