import { writable } from 'svelte/store';
import type { AppSettings } from '$lib/types';

const SETTINGS_KEY = 'sc_settings_v3';

const defaults: AppSettings = {
  weatherAdaptiveTheme: true,
  privacyMode: false,
  themeMode: 'auto',
  clockPosition: 'center',
  pomodoroWork: 25,
  pomodoroBreak: 5,
  soundEnabled: false,
  binauralEnabled: false,
  zenMode: false,
  reduceMotion: false,
};

function loadSettings(): AppSettings {
  if (typeof localStorage === 'undefined') return { ...defaults };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
  } catch {
    return { ...defaults };
  }
}

function createSettings() {
  const { subscribe, set, update } = writable<AppSettings>(loadSettings());

  return {
    subscribe,
    set(value: AppSettings) {
      set(value);
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(value)); } catch {}
    },
    update(fn: (v: AppSettings) => AppSettings) {
      update(current => {
        const next = fn(current);
        try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch {}
        return next;
      });
    },
    toggle(key: keyof AppSettings) {
      this.update(s => ({ ...s, [key]: !s[key] }));
    },
    setKey<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
      this.update(s => ({ ...s, [key]: value }));
    },
  };
}

export const settings = createSettings();
