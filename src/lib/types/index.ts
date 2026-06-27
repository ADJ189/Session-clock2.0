// ── Core types for Session Clock ──────────────────────────────────────

export type WeatherOverlay = 'clear' | 'rain' | 'snow' | 'thunder' | 'fog' | 'cloudy' | 'none';

export interface WeatherData {
  temp: number | null;
  feelsLike: number | null;
  wind: number | null;
  humidity: number | null;
  desc: string;
  code: number | null;
  overlay: WeatherOverlay;
  icon: string;
}

export interface HourlyForecast {
  time: string;
  temp: number;
  code: number;
}

export interface DailyForecast {
  date: string;
  minTemp: number;
  maxTemp: number;
  code: number;
}

export interface SunTimes {
  rise: number;   // minutes since midnight
  set: number;
  noon: number;
}

export interface StoredLocation {
  lat: number;
  lon: number;
  name?: string;
}

export type TabId = 'clock' | 'weather' | 'pomodoro' | 'log' | 'settings';

export interface Tab {
  id: TabId;
  path: string;
  label: string;
  icon: string;
}

export type ClockPosition = 'center' | 'top' | 'bottom';
export type ThemeMode = 'auto' | 'dark' | 'light';

export interface AppSettings {
  weatherAdaptiveTheme: boolean;
  privacyMode: boolean;
  themeMode: ThemeMode;
  clockPosition: ClockPosition;
  pomodoroWork: number;
  pomodoroBreak: number;
  soundEnabled: boolean;
  binauralEnabled: boolean;
  zenMode: boolean;
  reduceMotion: boolean;
}
