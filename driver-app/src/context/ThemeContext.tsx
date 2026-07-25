import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme as useSystemScheme } from 'react-native';
import {
  AppColors,
  DarkColors,
  LightColors,
  getColors,
  getShadow,
} from '@/constants/Colors';

const STORAGE_KEY = 'raydo_driver_theme_mode';

export type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  mode: ThemeMode;
  scheme: 'light' | 'dark';
  isDark: boolean;
  colors: AppColors;
  shadow: ReturnType<typeof getShadow>;
  setMode: (mode: ThemeMode) => void;
  setDark: (dark: boolean) => void;
  toggleDark: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

async function loadMode(): Promise<ThemeMode | null> {
  try {
    // Prefer async-storage if present; fall back to memory-only
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  } catch {
    try {
      // web / no package
      if (typeof localStorage !== 'undefined') {
        const s = localStorage.getItem(STORAGE_KEY);
        if (s === 'light' || s === 'dark' || s === 'system') return s;
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

async function saveMode(mode: ThemeMode) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  } catch {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useSystemScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    loadMode().then((m) => {
      if (m) setModeState(m);
    });
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    saveMode(m);
  }, []);

  const setDark = useCallback(
    (dark: boolean) => {
      setMode(dark ? 'dark' : 'light');
    },
    [setMode],
  );

  const toggleDark = useCallback(() => {
    setModeState((prev) => {
      const systemDark = system === 'dark';
      const current = prev === 'system' ? (systemDark ? 'dark' : 'light') : prev;
      const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
      saveMode(next);
      return next;
    });
  }, [system]);

  const scheme: 'light' | 'dark' =
    mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;

  const colors = useMemo(() => getColors(scheme), [scheme]);
  const shadow = useMemo(() => getShadow(colors), [colors]);

  const value = useMemo(
    () => ({
      mode,
      scheme,
      isDark: scheme === 'dark',
      colors,
      shadow,
      setMode,
      setDark,
      toggleDark,
    }),
    [mode, scheme, colors, shadow, setMode, setDark, toggleDark],
  );

  void LightColors;
  void DarkColors;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      mode: 'light' as ThemeMode,
      scheme: 'light' as const,
      isDark: false,
      colors: LightColors,
      shadow: getShadow(LightColors),
      setMode: () => {},
      setDark: () => {},
      toggleDark: () => {},
    };
  }
  return ctx;
}
