export type AppColors = {
  primary: string;
  primarySoft: string;
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
  textOnPrimary: string;
  textOnAccent: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  error: string;
  errorSoft: string;
  info: string;
  infoSoft: string;
  online: string;
  offline: string;
  white: string;
  black: string;
  overlay: string;
  shadow: string;
  mapTint: string;
};

export const LightColors: AppColors = {
  primary: '#0F1C3F',
  primarySoft: '#1B2A4A',
  accent: '#C9A25D',
  accentSoft: '#F5EDDC',
  accentDark: '#A8843F',
  background: '#F6F4EF',
  surface: '#FFFFFF',
  surfaceMuted: '#F0EDE6',
  border: '#E6E2D9',
  borderStrong: '#D4CFC4',
  text: '#1A2236',
  textSecondary: '#5C667A',
  textLight: '#8A95A5',
  textOnPrimary: '#FFFFFF',
  textOnAccent: '#1A2236',
  success: '#2F8F5B',
  successSoft: '#E7F6EE',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  error: '#D64545',
  errorSoft: '#FDECEC',
  info: '#2B6CB0',
  infoSoft: '#E8F1FB',
  online: '#16A34A',
  offline: '#94A3B8',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(15, 28, 63, 0.55)',
  shadow: '#0F1C3F',
  mapTint: '#E8EEF6',
};

export const DarkColors: AppColors = {
  primary: '#7BA3E0',
  primarySoft: '#2A3F66',
  accent: '#D4B06A',
  accentSoft: '#3A3428',
  accentDark: '#E0C48A',
  background: '#0B1018',
  surface: '#151C28',
  surfaceMuted: '#1E2838',
  border: '#2A3648',
  borderStrong: '#3A4A60',
  text: '#F0F3F7',
  textSecondary: '#A8B4C4',
  textLight: '#7A8799',
  textOnPrimary: '#0B1018',
  textOnAccent: '#0B1018',
  success: '#5CB88A',
  successSoft: '#1A3328',
  warning: '#E0A040',
  warningSoft: '#3D3018',
  error: '#E87070',
  errorSoft: '#3D2020',
  info: '#6BA3E0',
  infoSoft: '#1A2A3D',
  online: '#22C55E',
  offline: '#64748B',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.65)',
  shadow: '#000000',
  mapTint: '#151C28',
};

export const Colors: AppColors = { ...LightColors };

export function getColors(scheme: 'light' | 'dark'): AppColors {
  return scheme === 'dark' ? DarkColors : LightColors;
}

export function getShadow(c: AppColors) {
  const dark = c.background === DarkColors.background;
  return {
    card: {
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: dark ? 0.4 : 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    soft: {
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: dark ? 0.35 : 0.06,
      shadowRadius: 10,
      elevation: 2,
    },
    floating: {
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: dark ? 0.45 : 0.14,
      shadowRadius: 24,
      elevation: 8,
    },
  } as const;
}

export const Radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 999,
} as const;

export const Shadow = getShadow(LightColors);
