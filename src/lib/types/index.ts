export interface Theme {
  id: string;
  name: string;
  cat: 'nat' | 'tv' | 'movie' | 'f1' | 'anime' | 'animation';
  sub?: string;
  tagline?: string;
  swatch?: string;
  font: string;
  bgType: string;
  baseBg: string[];
  bgColors?: string[];
  overlay: string;
  vignette: string;
  text: string;
  accent: string;
  accent2: string;
  track: string;
  btnBg: string;
  btnFg: string;
  pill: string;
  panel: string;
  glow: string;
  hdr: boolean;
  grain: boolean;
  scanlines: boolean;
  lb: boolean;
  isMedia: boolean;
  light?: boolean;
  transition?: string;
  quotes?: string[];
}

export interface AppSettings {
  weatherAdaptiveTheme: boolean;
  privacyMode: boolean;
  themeMode: 'auto' | 'manual';
  clockPosition: 'center' | 'left';
  pomodoroWork: number;
  pomodoroBreak: number;
  soundEnabled: boolean;
  binauralEnabled: boolean;
  zenMode: boolean;
  reduceMotion: boolean;
  currentThemeId: string;
  qualityTier: 'low' | 'med' | 'high' | 'auto';
}

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
export type WeatherOverlay = 'none'|'clear'|'cloudy'|'rain'|'snow'|'thunder'|'fog';
export interface HourlyForecast { time: string; temp: number; code: number; }
export interface DailyForecast { date: string; minTemp: number; maxTemp: number; code: number; }
export interface SunTimes { rise: number; set: number; noon: number; }
export interface StoredLocation { lat: number; lon: number; name: string; }
