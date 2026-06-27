import { writable, derived } from 'svelte/store';
import { settings } from './settings';
import { weatherOverlay } from './weather';

// Active canvas/CSS theme name
export const currentTheme = writable<string>('aurora');

// Whether the adaptive weather overlay is visible
export const weatherOverlayActive = derived(
  [settings, weatherOverlay],
  ([$s, $overlay]) => $s.weatherAdaptiveTheme && $overlay !== 'none'
);

export const activeWeatherClass = derived(
  [settings, weatherOverlay],
  ([$s, $overlay]) => $s.weatherAdaptiveTheme ? `weather-${$overlay}` : ''
);
