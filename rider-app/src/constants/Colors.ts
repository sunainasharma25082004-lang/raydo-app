export const Colors = {
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
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  full: 999,
} as const;

export const Shadow = {
  soft: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  card: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  floating: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 10,
  },
} as const;
