import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, Appearance, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT_COLORS, DARK_COLORS } from '../theme/theme';

const THEME_STORAGE_KEY = '@embroidex_theme_mode';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme(); // 'light' | 'dark' | null
  const [themeMode, setThemeModeState] = useState('system'); // 'system' | 'light' | 'dark'
  const [systemTheme, setSystemTheme] = useState(systemColorScheme || 'light');

  // 1. Listen for device appearance changes in real time
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme || 'light');
    });

    if (systemColorScheme) {
      setSystemTheme(systemColorScheme);
    }

    return () => subscription.remove();
  }, [systemColorScheme]);

  // 2. Load stored user theme preference on app start
  useEffect(() => {
    const loadStoredTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored && (stored === 'system' || stored === 'light' || stored === 'dark')) {
          setThemeModeState(stored);
        }
      } catch (err) {
        console.warn('Could not load stored theme preference:', err);
      }
    };
    loadStoredTheme();
  }, []);

  // 3. Determine active theme ('light' or 'dark')
  const activeTheme =
    themeMode === 'system' ? systemTheme : themeMode;

  const isDark = activeTheme === 'dark';
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  // 4. Update status bar automatically
  useEffect(() => {
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
  }, [isDark]);

  // 5. Change theme mode function
  const setThemeMode = async (mode) => {
    if (mode !== 'system' && mode !== 'light' && mode !== 'dark') return;
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (err) {
      console.warn('Could not save theme preference:', err);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        activeTheme,
        isDark,
        colors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
