import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Paletas "Soft UI" de la guía de estilos (6 temas).
// Tokens CSS de la guía → tokens internos de la app.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'notas.theme.v1';

function hexToRgb(hex) {
  let h = (hex || '').replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
}

// Mezcla dos colores hex. `weight` es la proporción de `a` (0..1).
export function mix(a, b, weight) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const out = A.map((x, i) => x * weight + B[i] * (1 - weight));
  return rgbToHex(out[0], out[1], out[2]);
}

const RAW = {
  'mint-paper': {
    label: 'Menta papel',
    mode: 'light',
    bg: '#ebe9e3',
    card: '#f5f3ee',
    surface2: '#e2e0da',
    ink: '#252522',
    muted: '#6f706b',
    line: '#d3d0c8',
    accent: '#9be8cf',
    accentHover: '#82ddc0',
    accentInk: '#163b31',
    focusRing: '#52d7ae',
    success: '#4fae87',
    successSoft: '#c3ebdb',
    warn: '#a67818',
    warnSoft: '#f2dda1',
    danger: '#b95050',
    dangerSoft: '#f0b2b2',
    dangerInk: '#ffffff',
    shadowDark: 'rgba(111,106,96,0.28)',
    shadowLight: 'rgba(255,255,255,0.88)',
  },
  'lavender-mist': {
    label: 'Niebla lavanda',
    mode: 'light',
    bg: '#eceaf2',
    card: '#f7f5fb',
    surface2: '#dfdce8',
    ink: '#292631',
    muted: '#706b7b',
    line: '#d1cddd',
    accent: '#c8b8f4',
    accentHover: '#b39eea',
    accentInk: '#302452',
    focusRing: '#9b7ee3',
    success: '#4d9d7e',
    successSoft: '#c9e9dc',
    warn: '#9a741d',
    warnSoft: '#f1dda8',
    danger: '#ae5367',
    dangerSoft: '#efbdc8',
    dangerInk: '#ffffff',
    shadowDark: 'rgba(99,91,119,0.25)',
    shadowLight: 'rgba(255,255,255,0.90)',
  },
  'apricot-studio': {
    label: 'Estudio albaricoque',
    mode: 'light',
    bg: '#f1e9df',
    card: '#faf4eb',
    surface2: '#e7dcd0',
    ink: '#302721',
    muted: '#786b62',
    line: '#d9cabc',
    accent: '#f2b58f',
    accentHover: '#e99d71',
    accentInk: '#502918',
    focusRing: '#e88856',
    success: '#5b9c76',
    successSoft: '#cce7d7',
    warn: '#9a6b17',
    warnSoft: '#f3d997',
    danger: '#b6534c',
    dangerSoft: '#efb8b1',
    dangerInk: '#ffffff',
    shadowDark: 'rgba(130,104,84,0.25)',
    shadowLight: 'rgba(255,255,255,0.88)',
  },
  'midnight-mint': {
    label: 'Medianoche menta',
    mode: 'dark',
    bg: '#171b1a',
    card: '#212725',
    surface2: '#2a322f',
    ink: '#f0f4f1',
    muted: '#a2ada8',
    line: '#39433f',
    accent: '#72d5b4',
    accentHover: '#8be1c4',
    accentInk: '#102d25',
    focusRing: '#79e8c3',
    success: '#68c69e',
    successSoft: '#234b3d',
    warn: '#e2b95f',
    warnSoft: '#4d3f22',
    danger: '#e58282',
    dangerSoft: '#512d2d',
    dangerInk: '#2b1212',
    shadowDark: 'rgba(3,7,6,0.72)',
    shadowLight: 'rgba(67,82,76,0.38)',
  },
  'ink-violet': {
    label: 'Tinta violeta',
    mode: 'dark',
    bg: '#181720',
    card: '#24222e',
    surface2: '#2f2c3b',
    ink: '#f3f0f8',
    muted: '#aaa5b7',
    line: '#423e50',
    accent: '#b7a0ee',
    accentHover: '#c8b6f5',
    accentInk: '#271b45',
    focusRing: '#c0a8ff',
    success: '#77c5a1',
    successSoft: '#294739',
    warn: '#dfb866',
    warnSoft: '#4b3d25',
    danger: '#df7c91',
    dangerSoft: '#502d37',
    dangerInk: '#2b1216',
    shadowDark: 'rgba(5,4,10,0.74)',
    shadowLight: 'rgba(70,65,87,0.38)',
  },
  'graphite-amber': {
    label: 'Grafito ámbar',
    mode: 'dark',
    bg: '#1c1b19',
    card: '#292724',
    surface2: '#34312d',
    ink: '#f4f0e8',
    muted: '#afa99e',
    line: '#47433c',
    accent: '#e8ba64',
    accentHover: '#f0ca82',
    accentInk: '#38270d',
    focusRing: '#ffd17a',
    success: '#83bd91',
    successSoft: '#304638',
    warn: '#e8ba64',
    warnSoft: '#4e3e22',
    danger: '#df7b70',
    dangerSoft: '#512e2a',
    dangerInk: '#2b1512',
    shadowDark: 'rgba(5,4,3,0.76)',
    shadowLight: 'rgba(79,74,66,0.38)',
  },
};

export const THEMES = Object.fromEntries(
  Object.entries(RAW).map(([key, t]) => [
    key,
    {
      ...t,
      key,
      // Tinte suave del acento para fondos de badges/estados activos.
      accentSoft: mix(t.accent, t.card, 0.16),
    },
  ])
);

export const THEME_KEYS = Object.keys(THEMES);
export const DEFAULT_THEME = 'mint-paper';

// Radios y tipografía (no dependen del tema).
export const radius = 22;
export const radiusSm = 16;
export const font = {
  regular: undefined,
  bold: '700',
  heavy: '800',
};

const ThemeContext = createContext(null);

// Tipografía de la guía: Inter (con fallback a sistema). Solo aplica en web.
function installWebBase() {
  if (typeof document === 'undefined') return;
  if (!document.getElementById('notes-font-link')) {
    const link = document.createElement('link');
    link.id = 'notes-font-link';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';
    document.head.appendChild(link);
  }
  if (!document.getElementById('notes-base-css')) {
    const style = document.createElement('style');
    style.id = 'notes-base-css';
    style.textContent =
      "html, body, #root { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }";
    document.head.appendChild(style);
  }
}

export function ThemeProvider({ children }) {
  const [themeKey, setThemeKeyState] = useState(DEFAULT_THEME);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    installWebBase();
  }, []);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((k) => {
        if (mounted && k && THEMES[k]) setThemeKeyState(k);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const setThemeKey = useMemo(
    () => (k) => {
      if (!THEMES[k]) return;
      setThemeKeyState(k);
      AsyncStorage.setItem(STORAGE_KEY, k).catch(() => {});
    },
    []
  );

  const value = useMemo(
    () => ({ themeKey, theme: THEMES[themeKey], setThemeKey, ready }),
    [themeKey, setThemeKey, ready]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>.');
  return ctx;
}
