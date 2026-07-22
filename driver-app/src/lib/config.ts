import { Platform } from 'react-native';

/**
 * Your PC Wi‑Fi IP (phone must be on same Wi‑Fi).
 * Update this if `ipconfig` shows a different address.
 */
export const DEV_LAN_IP = '192.168.31.254';
export const API_PORT = 5000;

export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android'
    ? `http://${DEV_LAN_IP}:${API_PORT}`
    : `http://${DEV_LAN_IP}:${API_PORT}`);

export const SOCKET_URL = API_BASE;
