import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

let configured = false;

export async function setupRiderNotifications() {
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
    if (final !== 'granted') return false;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('rides', {
        name: 'Ride updates',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 200, 100, 200],
        lightColor: '#C9A25D',
        sound: 'default',
      });
    }
    return true;
  } catch {
    return false;
  }
}

export async function notifyDriverAssigned(opts: {
  driverName: string;
  etaMinutes?: number | null;
  vehicle?: string;
}) {
  try {
    await setupRiderNotifications();
    const eta =
      opts.etaMinutes != null ? ` · ETA ~${opts.etaMinutes} min` : '';
    await Notifications.scheduleNotificationAsync({
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
    await setupRiderNotifications();
    await Notifications.scheduleNotificationAsync({
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
