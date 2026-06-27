import { writable, derived } from 'svelte/store';
import type { WeatherData, HourlyForecast, DailyForecast, SunTimes, StoredLocation, WeatherOverlay } from '$lib/types';

// ── WMO code table ────────────────────────────────────────────────────
export const WMO: Record<number, [string, string]> = {
  0:['☀️','Clear'], 1:['🌤','Mostly clear'], 2:['⛅','Partly cloudy'], 3:['☁️','Overcast'],
  45:['🌫','Foggy'], 48:['🌫','Icy fog'],
  51:['🌦','Light drizzle'], 53:['🌦','Drizzle'], 55:['🌧','Heavy drizzle'],
  61:['🌧','Light rain'], 63:['🌧','Rain'], 65:['🌧','Heavy rain'],
  71:['🌨','Light snow'], 73:['🌨','Snow'], 75:['🌨','Heavy snow'],
  77:['🌨','Snow grains'], 80:['🌦','Showers'], 81:['🌧','Rain showers'],
  82:['🌧','Heavy showers'], 85:['🌨','Light snow showers'], 86:['🌨','Heavy snow showers'],
  95:['⛈','Thunderstorm'], 96:['⛈','Thunderstorm+hail'], 99:['⛈','Heavy thunderstorm'],
};

export function getWMOInfo(code: number): [string, string] {
  return WMO[code] ?? ['🌡', 'Unknown'];
}

function codeToOverlay(code: number | null): WeatherOverlay {
  if (code === null) return 'none';
  if (code >= 95) return 'thunder';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if (code === 45 || code === 48) return 'fog';
  if (code === 3) return 'cloudy';
  if (code <= 2) return 'clear';
  return 'none';
}

// ── Stores ────────────────────────────────────────────────────────────
export const weatherData = writable<WeatherData>({
  temp: null, feelsLike: null, wind: null, humidity: null,
  desc: '', code: null, overlay: 'none', icon: '🌡',
});

export const hourlyForecast = writable<HourlyForecast[]>([]);
export const dailyForecast = writable<DailyForecast[]>([]);
export const sunTimes = writable<SunTimes | null>(null);
export const storedLocation = writable<StoredLocation | null>(null);
export const weatherLoading = writable(false);

export const weatherOverlay = derived(weatherData, $w => $w.overlay);

// ── Location helpers ──────────────────────────────────────────────────
function sanitizeStoredLocation(loc: StoredLocation): StoredLocation {
  const round2 = (n: number) => Math.round(n * 100) / 100;
  return { ...loc, lat: round2(loc.lat), lon: round2(loc.lon) };
}

export function loadStoredLocation(): StoredLocation | null {
  try {
    const raw = localStorage.getItem('sc_weather_loc');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredLocation;
    return sanitizeStoredLocation(parsed);
  } catch { return null; }
}

export function saveLocation(loc: StoredLocation) {
  const safeLoc = sanitizeStoredLocation(loc);
  try { localStorage.setItem('sc_weather_loc', JSON.stringify(safeLoc)); } catch {}
  storedLocation.set(safeLoc);
}

// ── Sun math ──────────────────────────────────────────────────────────
export function calcSunTimes(lat: number, lon: number): SunTimes {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const B = (360 / 365) * (dayOfYear - 81) * Math.PI / 180;
  const eqTime = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const decl = 23.45 * Math.sin(B) * Math.PI / 180;
  const latRad = lat * Math.PI / 180;
  const cosHa = -Math.tan(latRad) * Math.tan(decl);
  if (cosHa < -1) return { rise: 0, set: 1440, noon: 720 };
  if (cosHa >  1) return { rise: 720, set: 720, noon: 720 };
  const ha = Math.acos(cosHa) * 180 / Math.PI;
  const tzOffset = -now.getTimezoneOffset();
  const solarNoon = 720 - 4 * lon - eqTime + tzOffset;
  return { rise: solarNoon - 4 * ha, set: solarNoon + 4 * ha, noon: solarNoon };
}

// ── Weather fetch ─────────────────────────────────────────────────────
let refreshTimer = 0;

async function fetchWeather(lat: number, lon: number) {
  weatherLoading.set(true);
  const sun = calcSunTimes(lat, lon);
  sunTimes.set(sun);

  try {
    const url = `https://api.open-meteo.com/v1/forecast`
      + `?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}`
      + `&current=temperature_2m,apparent_temperature,weathercode,windspeed_10m,relativehumidity_2m`
      + `&hourly=temperature_2m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min`
      + `&temperature_unit=celsius&windspeed_unit=kmh&timezone=auto&forecast_days=7`;

    const res = await fetch(url, { signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined });
    const data = await res.json();
    const cur = data.current;
    const code: number = cur.weathercode;
    const [icon, desc] = getWMOInfo(code);

    weatherData.set({
      temp: Math.round(cur.temperature_2m),
      feelsLike: Math.round(cur.apparent_temperature),
      wind: Math.round(cur.windspeed_10m),
      humidity: Math.round(cur.relativehumidity_2m ?? 0),
      desc, code, icon, overlay: codeToOverlay(code),
    });

    // Hourly (next 24h)
    const nowIdx = data.hourly?.time?.findIndex((t: string) => new Date(t) > new Date()) ?? 0;
    hourlyForecast.set(
      (data.hourly?.time ?? []).slice(nowIdx, nowIdx + 24).map((t: string, i: number) => ({
        time: t,
        temp: Math.round(data.hourly.temperature_2m[nowIdx + i]),
        code: data.hourly.weathercode[nowIdx + i],
      }))
    );

    // Daily (7 days)
    dailyForecast.set(
      (data.daily?.time ?? []).map((t: string, i: number) => ({
        date: t,
        minTemp: Math.round(data.daily.temperature_2m_min[i]),
        maxTemp: Math.round(data.daily.temperature_2m_max[i]),
        code: data.daily.weathercode[i],
      }))
    );
  } catch {
    // Keep last known data
  } finally {
    weatherLoading.set(false);
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const d = await res.json();
    return d?.address?.city || d?.address?.town || d?.address?.village || '';
  } catch { return ''; }
}

export async function searchCity(query: string): Promise<Array<{name: string; sub: string; lat: number; lon: number}>> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`,
    { headers: { 'Accept-Language': 'en' } }
  );
  const data = await res.json();
  return data.map((item: any) => ({
    name: item.address?.city || item.address?.town || item.address?.village || item.display_name.split(',')[0],
    sub: [item.address?.state, item.address?.country].filter(Boolean).join(', '),
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon),
  }));
}

export function initWeatherService(isPrivate: () => boolean) {
  if (isPrivate()) return;

  const tryGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lon } }) => {
        const name = await reverseGeocode(lat, lon);
        const loc = { lat, lon, name };
        saveLocation(loc);
        fetchWeather(lat, lon);
      },
      () => { /* denied silently */ },
      { timeout: 8000, maximumAge: 300_000 }
    );
  };

  const stored = loadStoredLocation();
  if (stored) {
    storedLocation.set(stored);
    fetchWeather(stored.lat, stored.lon);
  } else {
    tryGPS();
  }

  clearInterval(refreshTimer);
  refreshTimer = window.setInterval(() => {
    if (isPrivate()) return;
    const loc = loadStoredLocation();
    if (loc) fetchWeather(loc.lat, loc.lon);
  }, 15 * 60_000);
}

export function refreshWeather() {
  const loc = loadStoredLocation();
  if (loc) fetchWeather(loc.lat, loc.lon);
}
