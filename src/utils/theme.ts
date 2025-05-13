export type Theme = 'light' | 'dark' | 'system';

export function getSystemTheme(): Theme {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light'; // Default to light for SSR
}

export function applyTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  const isDark = theme === 'dark' || (theme === 'system' && getSystemTheme() === 'dark');

  root.classList.remove('light', 'dark');
  root.classList.add(isDark ? 'dark' : 'light');
  
  localStorage.setItem('theme', theme);
}

export function getThemeFromStorage(): Theme {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem('theme') as Theme) || 'system';
}

export function applyThemeFromStorage(): void {
  const theme = getThemeFromStorage();
  applyTheme(theme);
} 