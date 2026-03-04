import { useCallback, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'todo-list-theme';

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // localStorage unavailable
  }
  return 'system';
}

function getResolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

function applyTheme(theme: Theme) {
  const resolved = getResolvedTheme(theme);
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

// Simple external store for cross-component reactivity
let currentTheme: Theme = getStoredTheme();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Theme {
  return currentTheme;
}

function setTheme(theme: Theme) {
  currentTheme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage unavailable
  }
  applyTheme(theme);
  listeners.forEach((l) => l());
}

// Apply on load
applyTheme(currentTheme);

// Listen for system preference changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (currentTheme === 'system') {
    applyTheme('system');
    listeners.forEach((l) => l());
  }
});

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot);
  const resolvedTheme = getResolvedTheme(theme);

  const toggleTheme = useCallback(() => {
    if (resolvedTheme === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, [resolvedTheme]);

  return { theme, resolvedTheme, setTheme, toggleTheme };
}
