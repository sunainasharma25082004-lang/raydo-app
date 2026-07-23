import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  onboardingDone: 'raydo_rider_onboarding_done',
  loggedIn: 'raydo_rider_logged_in',
  phone: 'raydo_rider_phone',
} as const;

export type RiderSession = {
  onboardingDone: boolean;
  loggedIn: boolean;
  phone: string | null;
};

export async function getRiderSession(): Promise<RiderSession> {
  try {
    const [onboardingDone, loggedIn, phone] = await Promise.all([
      AsyncStorage.getItem(KEYS.onboardingDone),
      AsyncStorage.getItem(KEYS.loggedIn),
      AsyncStorage.getItem(KEYS.phone),
    ]);
    return {
      onboardingDone: onboardingDone === '1',
      loggedIn: loggedIn === '1',
      phone: phone || null,
    };
  } catch {
    return { onboardingDone: false, loggedIn: false, phone: null };
  }
}

export async function markOnboardingDone(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.onboardingDone, '1');
  } catch {
    /* ignore */
  }
}

export async function saveRiderLogin(phone: string): Promise<void> {
  try {
    await AsyncStorage.multiSet([
      [KEYS.onboardingDone, '1'],
      [KEYS.loggedIn, '1'],
      [KEYS.phone, phone],
    ]);
  } catch {
    /* ignore */
  }
}

export async function clearRiderLogin(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([KEYS.loggedIn, KEYS.phone]);
  } catch {
    /* ignore */
  }
}
