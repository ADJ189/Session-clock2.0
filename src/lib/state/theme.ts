import { writable, derived } from 'svelte/store';
import { settings } from './settings.js';
import { weatherOverlay } from './weather.js';
import { THEMES, THEME_BY_ID, NAT_QUOTES } from '$lib/themes.js';
import type { Theme } from '$lib/types/index.js';

// Resolve current Theme object from settings
export const currentTheme = derived(settings, $s => {
  return THEME_BY_ID[$s.currentThemeId] ?? THEMES[0]!;
});

export const weatherOverlayActive = derived(
  [settings, weatherOverlay],
  ([$s, $overlay]) => $s.weatherAdaptiveTheme && $overlay !== 'none'
);

export const activeWeatherClass = derived(
  [settings, weatherOverlay],
  ([$s, $overlay]) => $s.weatherAdaptiveTheme ? `weather-${$overlay}` : ''
);

// Expose all themes + categories for the picker
export { THEMES, THEME_BY_ID };
export const THEME_CATS = ['nat', 'tv', 'movie', 'animation', 'anime', 'f1'] as const;
export type ThemeCat = typeof THEME_CATS[number];
export const CAT_LABELS: Record<ThemeCat, string> = {
  nat: 'Nature & Style',
  tv: 'TV Shows',
  movie: 'Movies',
  animation: 'Animation',
  anime: 'Anime',
  f1: 'Formula 1',
};

// Re-export canonical NAT_QUOTES (defined once in themes.ts)
export { NAT_QUOTES };
