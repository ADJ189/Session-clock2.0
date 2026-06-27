import { writable, derived } from 'svelte/store';
import { page } from '$app/stores';
import type { Tab, TabId } from '$lib/types';

export const tabs: Tab[] = [
  { id: 'clock',    path: '/',          label: 'Clock',    icon: '⏱' },
  { id: 'weather',  path: '/weather',   label: 'Weather',  icon: '🌤' },
  { id: 'pomodoro', path: '/pomodoro',  label: 'Focus',    icon: '🍅' },
  { id: 'log',      path: '/log',       label: 'Log',      icon: '📊' },
  { id: 'settings', path: '/settings',  label: 'Settings', icon: '⚙' },
];

export const activeTab = derived(page, $page => {
  const path = $page.url.pathname;
  return tabs.find(t => t.path === path)?.id ?? 'clock' as TabId;
});
