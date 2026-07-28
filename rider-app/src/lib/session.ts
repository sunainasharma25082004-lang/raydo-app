import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  onboardingDone: 'raydo_rider_onboarding_done',
  loggedIn: 'raydo_rider_logged_in',
  phone: 'raydo_rider_phone',
  profile: 'raydo_rider_profile',
} as const;

export type RiderSession = {
  onboardingDone: boolean;
  loggedIn: boolean;
  phone: string | null;
};

export type RiderProfile = {
  name: string;
  phone: string;
  email: string;
  city: string;
};

const DEFAULT_PROFILE: RiderProfile = {
  name: 'Rahul Sharma',
  phone: '+91 98765 43210',
  email: 'rahul.sharma@email.com',
  city: 'Bengaluru',
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

/** Format 10-digit local number as +91 XXXXX XXXXX when possible */
export function formatRiderPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  const trimmed = raw.trim();
  return trimmed || DEFAULT_PROFILE.phone;
}

export async function getRiderProfile(): Promise<RiderProfile> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.profile);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<RiderProfile>;
      return {
        name: (parsed.name ?? DEFAULT_PROFILE.name).trim() || DEFAULT_PROFILE.name,
        phone: (parsed.phone ?? DEFAULT_PROFILE.phone).trim() || DEFAULT_PROFILE.phone,
        email: (parsed.email ?? '').trim(),
        city: (parsed.city ?? DEFAULT_PROFILE.city).trim() || DEFAULT_PROFILE.city,
      };
    }
    // Fall back to login phone if profile never edited
    const sessionPhone = await AsyncStorage.getItem(KEYS.phone);
    if (sessionPhone) {
      return {
        ...DEFAULT_PROFILE,
        phone: formatRiderPhone(sessionPhone),
      };
    }
    return { ...DEFAULT_PROFILE };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export async function saveRiderProfile(profile: RiderProfile): Promise<void> {
  const next: RiderProfile = {
    name: profile.name.trim() || DEFAULT_PROFILE.name,
    phone: profile.phone.trim() || DEFAULT_PROFILE.phone,
    email: profile.email.trim(),
    city: profile.city.trim() || DEFAULT_PROFILE.city,
  };
  try {
    await AsyncStorage.setItem(KEYS.profile, JSON.stringify(next));
    // Keep session phone in sync for auth/session helpers
    const digits = next.phone.replace(/\D/g, '');
    const local =
      digits.length === 12 && digits.startsWith('91')
        ? digits.slice(2)
        : digits.length >= 10
          ? digits.slice(-10)
          : digits;
    if (local) {
      await AsyncStorage.setItem(KEYS.phone, local);
    }
  } catch {
    /* ignore */
  }
}

/** Initials for avatar (e.g. "Rahul Sharma" → "RS") */
export function getProfileInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'R';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function saveRiderLogin(phone: string): Promise<void> {
  try {
    const formatted = formatRiderPhone(phone);
    await AsyncStorage.multiSet([
      [KEYS.onboardingDone, '1'],
      [KEYS.loggedIn, '1'],
      [KEYS.phone, phone.replace(/\D/g, '').slice(-10) || phone],
    ]);
    // Seed / refresh phone on profile without wiping edited name/email/city
    const existing = await getRiderProfile();
    const hasCustom =
      (await AsyncStorage.getItem(KEYS.profile)) != null;
    if (hasCustom) {
      await saveRiderProfile({ ...existing, phone: formatted });
    } else {
      await saveRiderProfile({
        ...DEFAULT_PROFILE,
        phone: formatted,
      });
    }
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
