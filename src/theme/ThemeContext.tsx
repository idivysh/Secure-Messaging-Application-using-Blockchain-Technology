import { createContext, useEffect, useState, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

export type ThemePreference = 'system' | 'light' | 'dark';

export type Theme = {
  // colors (used everywhere already)
  mode: 'light' | 'dark';
  background: string;
  text: string;
  subText: string;
  inputBg: string;
  primary: string;
  border: string;

  // 🔥 NEW (for settings screen)
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
};

export const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = Appearance.getColorScheme() ?? 'light';

  const [preference, setPreference] = useState<ThemePreference>('system');
  const [mode, setMode] = useState<'light' | 'dark'>(
    systemScheme === 'dark' ? 'dark' : 'light'
  );

  // 🔥 Handle system theme changes
  useEffect(() => {
    const listener = Appearance.addChangeListener(
      ({ colorScheme }: { colorScheme: ColorSchemeName }) => {
        if (preference === 'system' && (colorScheme === 'light' || colorScheme === 'dark')) {
          setMode(colorScheme);
        }
      }
    );

    return () => listener.remove();
  }, [preference]);

  // 🔥 Apply preference
  useEffect(() => {
    if (preference === 'system') {
      const scheme = Appearance.getColorScheme();
      setMode(scheme === 'dark' ? 'dark' : 'light');
    } else {
      setMode(preference);
    }
  }, [preference]);

  const colors =
    mode === 'dark'
      ? {
          mode: 'dark' as const,
          background: '#000000',
          text: '#FFFFFF',
          subText: '#9CA3AF',
          inputBg: '#111827',
          primary: '#3B82F6',
          border: '#1F2937',
        }
      : {
          mode: 'light' as const,
          background: '#FFFFFF',
          text: '#000000',
          subText: '#6B7280',
          inputBg: '#F3F4F6',
          primary: '#2563EB',
          border: '#E5E7EB',
        };

  return (
    <ThemeContext.Provider
      value={{
        ...colors,
        preference,
        setPreference,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
