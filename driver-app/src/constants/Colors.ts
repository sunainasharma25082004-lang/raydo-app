export const Colors = {
  // Brand
  primary: '#0F1C3F',
  primarySoft: '#1B2A4A',
  accent: '#C9A25D',
  accentSoft: '#F5EDDC',
  accentDark: '#A8843F',

  // Surfaces
  background: '#F6F4EF',
  surface: '#FFFFFF',
  surfaceMuted: '#F0EDE6',
  border: '#E6E2D9',
  borderStrong: '#D4CFC4',

  // Text
  text: '#1A2236',
  textSecondary: '#5C667A',
  textLight: '#8A95A5',
  textOnPrimary: '#FFFFFF',
  textOnAccent: '#1A2236',

  // Status
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

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(15, 28, 63, 0.55)',
  shadow: '#0F1C3F',
  mapTint: '#E8EEF6',
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 999,
} as const;

export const Shadow = {
  card: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  soft: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  floating: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;
