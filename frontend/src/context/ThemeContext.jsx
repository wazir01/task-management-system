import { createContext, useContext, useEffect, useState } from 'react';

export const THEMES = [
  { id: 'midnight', label: 'Midnight', swatch: ['#0c0f14', '#5b8def'] },
  { id: 'light', label: 'Light', swatch: ['#f4f6fa', '#3b6fd9'] },
  { id: 'ocean', label: 'Ocean', swatch: ['#0a1419', '#2dd4bf'] },
  { id: 'forest', label: 'Forest', swatch: ['#0d1210', '#4ade80'] },
];

const STORAGE_KEY = 'tasknest-theme';
const LEGACY_STORAGE_KEY = 'taskflow-theme';
const DEFAULT_THEME = 'midnight';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    return THEMES.some((t) => t.id === stored) ? stored : DEFAULT_THEME;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
