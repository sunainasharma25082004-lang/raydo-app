/**
 * Production API (Render). Override with EXPO_PUBLIC_API_URL for local backend.
 * Example local: EXPO_PUBLIC_API_URL=http://192.168.31.254:5000
 */
export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL || 'https://raydo-app-tqev.onrender.com';

export const SOCKET_URL = API_BASE;
