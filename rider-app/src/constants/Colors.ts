export type AppColors = {
  primary: string;
  primarySoft: string;
  primaryMuted: string;
  accent: string;
  accentSoft: string;
  accentDark: string;
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textLight: string;
  white: string;
  black: string;
  error: string;
  errorSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  overlay: string;
  mapTint: string;
  shadow: string;
};

export const LightColors: AppColors = {
  primary: '#1B2A4A',
  primarySoft: '#2A3F66',
  primaryMuted: '#E8ECF4',
  accent: '#C9A25D',
  accentSoft: '#F7F0E3',
  accentDark: '#A8843F',
  background: '#F7F4EF',
  surface: '#FFFFFF',
  surfaceMuted: '#F0EBE3',
  border: '#E8E2D8',
  borderStrong: '#D4CDC2',
  text: '#1A2236',
  textSecondary: '#5C667A',
  textLight: '#8A95A5',
  white: '#FFFFFF',
  black: '#0B1020',
  error: '#D97757',
  errorSoft: '#FDECE6',
  success: '#3D8B6E',
  successSoft: '#E6F5EF',
  warning: '#D4A017',
  overlay: 'rgba(15, 22, 40, 0.45)',
  mapTint: '#E8EEF6',
  shadow: '#1B2A4A',
};

export const DarkColors: AppColors = {
  primary: '#7BA3E0',
  primarySoft: '#3D5A80',
  primaryMuted: '#1E2A3C',
  accent: '#D4B06A',
  accentSoft: '#3A3428',
  accentDark: '#E0C48A',
  background: '#0F1419',
  surface: '#1A222D',
  surfaceMuted: '#243040',
  border: '#2E3A4A',
  borderStrong: '#3D4D63',
  text: '#F0F3F7',
  textSecondary: '#A8B4C4',
  textLight: '#7A8799',
  white: '#FFFFFF',
  black: '#000000',
  error: '#E8957A',
  errorSoft: '#3D2820',
  success: '#5CB88A',
  successSoft: '#1A3328',
  warning: '#E0B84A',
  overlay: 'rgba(0, 0, 0, 0.65)',
  mapTint: '#1A2430',
  shadow: '#000000',
};

/** Default light palette (backward compatible static import) */
export const Colors: AppColors = { ...LightColors };

export function getColors(scheme: 'light' | 'dark'): AppColors {
  return scheme === 'dark' ? DarkColors : LightColors;
}

export function getShadow(c: AppColors) {
  return {
    soft: {
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: schemeOpacity(c),
      shadowRadius: 12,
      elevation: 3,
    },
    card: {
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: schemeOpacity(c) + 0.02,
      shadowRadius: 20,
      elevation: 5,
    },
    floating: {
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: schemeOpacity(c) + 0.06,
      shadowRadius: 28,
      elevation: 10,
    },
  } as const;
}

function schemeOpacity(c: AppColors) {
  return c.background === DarkColors.background ? 0.35 : 0.06;
}

export const Radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  full: 999,
} as const;

/** Static shadow using light Colors (legacy) */
export const Shadow = getShadow(LightColors);
