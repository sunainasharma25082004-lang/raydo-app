import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme as useSystemScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppColors,
  DarkColors,
  LightColors,
  getColors,
  getShadow,
} from '@/constants/Colors';

const STORAGE_KEY = 'raydo_rider_theme_mode';

export type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  mode: ThemeMode;
  /** Resolved scheme after applying system preference */
  scheme: 'light' | 'dark';
  isDark: boolean;
  colors: AppColors;
  shadow: ReturnType<typeof getShadow>;
  setMode: (mode: ThemeMode) => void;
  setDark: (dark: boolean) => void;
  toggleDark: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useSystemScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setModeState(saved);
        }
      } catch {
        /* ignore */
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {});
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
      const current =
        prev === 'system' ? (systemDark ? 'dark' : 'light') : prev;
      const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
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

  // Avoid flash: still render (default system) while loading storage
  void ready;
  void LightColors;
  void DarkColors;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Safe fallback if used outside provider
    const scheme = 'light' as const;
    return {
      mode: 'light' as ThemeMode,
      scheme,
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
