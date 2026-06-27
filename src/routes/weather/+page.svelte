<script lang="ts">
  import { onMount } from 'svelte';
  import {
    weatherData, hourlyForecast, dailyForecast, sunTimes,
    storedLocation, weatherLoading, getWMOInfo,
    saveLocation, reverseGeocode, searchCity, refreshWeather,
    calcSunTimes,
  } from '$lib/state/weather';
  import { settings } from '$lib/state/settings';

  let showLocationPanel = false;
  let citySearchQuery = '';
  let cityResults: Array<{name: string; sub: string; lat: number; lon: number}> = [];
  let searching = false;
  let searchTimer = 0;
  let sunCanvas: HTMLCanvasElement;
  let currentTime = new Date();

  // Clock for live "Now"
  onMount(() => {
    const id = setInterval(() => { currentTime = new Date(); }, 60_000);
    return () => clearInterval(id);
  });

  // Redraw sun arc whenever sunTimes changes
  $: if (sunCanvas && $sunTimes) drawSunArc($sunTimes);

  async function onSearchInput() {
    clearTimeout(searchTimer);
    if (citySearchQuery.length < 2) { cityResults = []; return; }
    searchTimer = window.setTimeout(async () => {
      searching = true;
      try { cityResults = await searchCity(citySearchQuery); }
      catch { cityResults = []; }
      finally { searching = false; }
    }, 380);
  }

  async function useGPS() {
    if (!navigator.geolocation) return;
    showLocationPanel = false;
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lon } }) => {
        const name = await reverseGeocode(lat, lon);
        saveLocation({ lat, lon, name });
        refreshWeather();
      },
      () => {}
    );
  }

  function selectCity(r: {name: string; sub: string; lat: number; lon: number}) {
    saveLocation({ lat: r.lat, lon: r.lon, name: r.name });
    showLocationPanel = false;
    citySearchQuery = '';
    cityResults = [];
    refreshWeather();
  }

  function drawSunArc(sun: { rise: number; set: number }) {
    if (!sunCanvas) return;
    const ctx = sunCanvas.getContext('2d')!;
    const W = sunCanvas.width, H = sunCanvas.height;
    ctx.clearRect(0, 0, W, H);
    const riseX = (sun.rise / 1440) * W;
    const setX = (sun.set / 1440) * W;
    const midX = (riseX + setX) / 2;

    // Dim arc
    ctx.beginPath(); ctx.moveTo(riseX, H - 8);
    ctx.quadraticCurveTo(midX, 8, setX, H - 8);
    ctx.strokeStyle = 'rgba(255,200,80,.2)'; ctx.lineWidth = 2; ctx.stroke();

    const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    const pct = Math.max(0, Math.min(1, (nowMins - sun.rise) / (sun.set - sun.rise)));

    if (pct > 0 && pct <= 1) {
      const ex = riseX + pct * (setX - riseX);
      const ey = H - 8 - Math.sin(pct * Math.PI) * (H - 16);
      ctx.beginPath(); ctx.moveTo(riseX, H - 8);
      ctx.quadraticCurveTo(midX, 8, ex, ey);
      ctx.strokeStyle = 'rgba(255,200,80,.85)'; ctx.lineWidth = 2.5; ctx.stroke();
      const g = ctx.createRadialGradient(ex, ey, 0, ex, ey, 7);
      g.addColorStop(0, '#fff8c0'); g.addColorStop(1, '#ffb300');
      ctx.beginPath(); ctx.arc(ex, ey, 7, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();
    }

    ctx.beginPath(); ctx.moveTo(0, H - 8); ctx.lineTo(W, H - 8);
    ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.lineWidth = 1; ctx.stroke();
  }

  function fmtMins(mins: number) {
    const h = Math.floor(mins / 60), m = Math.round(mins % 60);
    return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
  }

  function fmtHour(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: 'numeric' });
  }

  function fmtDay(iso: string, i: number) {
    if (i === 0) return 'Today';
    return new Date(iso + 'T12:00:00').toLocaleDateString([], { weekday: 'short' });
  }

  $: daily = $dailyForecast;
  $: maxT = daily.length ? Math.max(...daily.map(d => d.maxTemp)) : 0;
  $: minT = daily.length ? Math.min(...daily.map(d => d.minTemp)) : 0;
  $: range = maxT - minT || 1;
</script>

<svelte:head><title>Weather — Session Clock</title></svelte:head>

<div class="weather-page" class:weather-loading={$weatherLoading}>

  <!-- Header -->
  <header class="weather-header">
    <div class="weather-location-info">
      <span class="weather-location-name">{$storedLocation?.name || ($weatherData.temp !== null ? 'Current location' : 'No location')}</span>
      <span class="weather-location-time">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
    <button class="weather-loc-trigger" on:click={() => showLocationPanel = true}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
      Set location
    </button>
  </header>

  <!-- Scrollable body -->
  <div class="weather-body">

    <!-- Hero -->
    <div class="weather-hero weather-hero--{$weatherData.overlay}">
      <div class="weather-hero-particles weather-particles-{$weatherData.overlay}" aria-hidden="true"></div>
      <div class="weather-hero-icon">{$weatherData.icon || '🌡'}</div>
      <div class="weather-hero-temp">{$weatherData.temp !== null ? `${$weatherData.temp}°` : '--°'}</div>
      <div class="weather-hero-desc">{$weatherData.desc || ($storedLocation ? 'Loading…' : 'Set a location to begin')}</div>
      {#if $weatherData.temp !== null}
        <div class="weather-hero-meta">
          <span>Feels like {$weatherData.feelsLike}°</span>
          <span class="sep">·</span>
          <span>{$weatherData.wind} km/h</span>
          <span class="sep">·</span>
          <span>{$weatherData.humidity}%</span>
        </div>
      {/if}
    </div>

    <!-- Hourly strip -->
    <section class="weather-section">
      <h2 class="weather-section-label">Next 24 hours</h2>
      <div class="hourly-strip">
        {#each $hourlyForecast.slice(0, 24) as h, i}
          {@const [icon] = getWMOInfo(h.code)}
          <div class="hourly-item">
            <span class="hourly-time">{i === 0 ? 'Now' : fmtHour(h.time)}</span>
            <span class="hourly-icon">{icon}</span>
            <span class="hourly-temp">{h.temp}°</span>
          </div>
        {:else}
          <p class="weather-empty">Set a location to see hourly forecast</p>
        {/each}
      </div>
    </section>

    <!-- Sun arc -->
    <section class="weather-section">
      <h2 class="weather-section-label">Daylight</h2>
      <div class="sun-wrap">
        <canvas bind:this={sunCanvas} class="sun-canvas" width="360" height="100"></canvas>
        {#if $sunTimes}
          <div class="sun-times">
            <span>🌅 {fmtMins($sunTimes.rise)}</span>
            <span>🌇 {fmtMins($sunTimes.set)}</span>
          </div>
        {:else}
          <p class="weather-empty" style="padding: 12px 0;">Set a location to see daylight</p>
        {/if}
      </div>
    </section>

    <!-- 7-day forecast -->
    <section class="weather-section">
      <h2 class="weather-section-label">7-Day Forecast</h2>
      <div class="daily-list">
        {#each $dailyForecast as d, i}
          {@const [icon, desc] = getWMOInfo(d.code)}
          {@const barLeft = ((d.minTemp - minT) / range) * 100}
          {@const barWidth = Math.max(((d.maxTemp - d.minTemp) / range) * 100, 8)}
          <div class="daily-row">
            <span class="daily-day">{fmtDay(d.date, i)}</span>
            <span class="daily-icon" title={desc}>{icon}</span>
            <div class="daily-bar-wrap">
              <span class="daily-min">{d.minTemp}°</span>
              <div class="daily-bar">
                <div class="daily-bar-fill" style="left:{barLeft.toFixed(1)}%;width:{barWidth.toFixed(1)}%"></div>
              </div>
              <span class="daily-max">{d.maxTemp}°</span>
            </div>
          </div>
        {:else}
          <p class="weather-empty" style="padding:12px;">Set a location to see forecast</p>
        {/each}
      </div>
    </section>

    <!-- Theme toggle -->
    <section class="weather-section">
      <div class="theme-toggle-row">
        <div class="theme-toggle-info">
          <span class="theme-toggle-label">Weather-adaptive theme</span>
          <span class="theme-toggle-desc">Subtly blend current conditions into your theme</span>
        </div>
        <button
          class="toggle-btn"
          class:on={$settings.weatherAdaptiveTheme}
          on:click={() => settings.toggle('weatherAdaptiveTheme')}
          aria-label="Toggle weather adaptive theme"
        >
          <span class="toggle-knob"></span>
        </button>
      </div>
    </section>

  </div>

  <!-- Location panel -->
  {#if showLocationPanel}
    <div class="location-panel" role="dialog" aria-label="Set location">
      <div class="location-panel-header">
        <span>Set Location</span>
        <button class="loc-cancel" on:click={() => showLocationPanel = false}>Cancel</button>
      </div>
      <div class="location-panel-body">
        <button class="loc-gps-btn" on:click={useGPS}>
          <span>📍</span>
          <div>
            <div class="loc-btn-label">Use GPS</div>
            <div class="loc-btn-sub">Detect automatically</div>
          </div>
        </button>
        <div class="loc-search-wrap">
          <svg class="loc-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            class="loc-search"
            type="text"
            placeholder="Search city…"
            bind:value={citySearchQuery}
            on:input={onSearchInput}
            autocomplete="off"
            spellcheck="false"
          >
        </div>
        <div class="loc-results">
          {#if searching}
            <div class="loc-loading">Searching…</div>
          {:else if cityResults.length}
            {#each cityResults as r}
              <button class="loc-result" on:click={() => selectCity(r)}>
                <span class="loc-result-name">{r.name}</span>
                <span class="loc-result-sub">{r.sub}</span>
              </button>
            {/each}
          {:else if citySearchQuery.length >= 2}
            <div class="loc-loading">No results</div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .weather-page {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    position: relative;
    overflow: hidden;
  }

  /* Header */
  .weather-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px 10px;
    border-bottom: 1px solid rgba(255,255,255,.06);
    flex-shrink: 0;
    gap: 12px;
  }
  .weather-location-info { display: flex; flex-direction: column; gap: 2px; }
  .weather-location-name { font-size: .8rem; font-weight: 700; }
  .weather-location-time { font-size: .58rem; opacity: .4; }
  .weather-loc-trigger {
    display: flex; align-items: center; gap: 5px;
    background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1);
    border-radius: 8px; padding: 5px 10px; font-size: .6rem; font-weight: 600;
    color: inherit; cursor: pointer; transition: background .15s; white-space: nowrap;
  }
  .weather-loc-trigger:hover { background: rgba(255,255,255,.13); }

  /* Scrollable body */
  .weather-body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    scroll-behavior: smooth;
    padding-bottom: 24px;
  }
  .weather-body::-webkit-scrollbar { width: 3px; }
  .weather-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 99px; }

  /* Hero */
  .weather-hero {
    position: relative;
    padding: 28px 24px 20px;
    text-align: center;
    overflow: hidden;
  }
  .weather-hero--clear    { background: radial-gradient(ellipse at 50% -20%, rgba(100,180,255,.18) 0%, transparent 70%); }
  .weather-hero--rain     { background: radial-gradient(ellipse at 50% -20%, rgba(60,100,160,.28) 0%, transparent 70%); }
  .weather-hero--thunder  { background: radial-gradient(ellipse at 50% -10%, rgba(80,40,140,.38) 0%, transparent 65%); }
  .weather-hero--snow     { background: radial-gradient(ellipse at 50% -20%, rgba(180,210,255,.15) 0%, transparent 70%); }
  .weather-hero--fog      { background: radial-gradient(ellipse at 50% 30%, rgba(120,130,150,.22) 0%, transparent 70%); }
  .weather-hero--cloudy   { background: radial-gradient(ellipse at 40% -10%, rgba(80,100,140,.2) 0%, transparent 65%); }

  .weather-hero-particles {
    position: absolute; inset: 0; pointer-events: none; z-index: 0;
  }
  .weather-particles-rain::before, .weather-particles-rain::after {
    content: '';
    position: absolute; inset: 0;
    background-image: repeating-linear-gradient(180deg, transparent 0px, transparent 8px, rgba(120,180,255,.1) 8px, rgba(120,180,255,.1) 9px);
    animation: rainFall 1.4s linear infinite;
  }
  .weather-particles-rain::after { animation-delay: -.7s; opacity: .6; }
  @keyframes rainFall { from { transform: translateY(-100%); } to { transform: translateY(100%); } }

  .weather-particles-thunder::before {
    content: '';
    position: absolute; inset: 0;
    animation: thunderFlash 5s ease-in-out infinite;
  }
  @keyframes thunderFlash {
    0%,88%,94%,100% { background: rgba(180,140,255,0); }
    89%,93%          { background: rgba(180,140,255,.08); }
  }

  .weather-particles-snow::before {
    content: '❄ ❅ ❆ ❄ ❅';
    position: absolute; inset: 0;
    font-size: 1rem; color: rgba(255,255,255,.15);
    letter-spacing: 28px; line-height: 2.5;
    animation: snowFall 6s linear infinite; overflow: hidden;
  }
  @keyframes snowFall {
    from { transform: translateY(-60px) translateX(0); }
    to   { transform: translateY(calc(100% + 60px)) translateX(20px); }
  }

  .weather-hero-icon {
    font-size: 3.5rem; line-height: 1; position: relative; z-index: 1;
    margin-bottom: 8px; filter: drop-shadow(0 0 18px rgba(255,255,255,.25));
    animation: iconFloat 4s ease-in-out infinite;
  }
  @keyframes iconFloat {
    0%,100% { transform: translateY(0); }
    50%     { transform: translateY(-6px); }
  }
  .weather-hero-temp {
    font-size: 4.2rem; font-weight: 800; line-height: 1; letter-spacing: -.03em;
    position: relative; z-index: 1;
    background: linear-gradient(135deg, #fff 60%, rgba(255,255,255,.5));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .weather-hero-desc { font-size: .82rem; opacity: .6; margin: 4px 0 10px; position: relative; z-index: 1; }
  .weather-hero-meta {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    font-size: .6rem; opacity: .48; position: relative; z-index: 1;
  }
  .sep { opacity: .35; }

  /* Sections */
  .weather-section { padding: 0 16px 16px; }
  .weather-section-label {
    font-size: .52rem; letter-spacing: .1em; text-transform: uppercase;
    opacity: .35; padding: 14px 4px 8px; font-weight: 600;
  }

  /* Hourly */
  .hourly-strip {
    display: flex; gap: 2px; overflow-x: auto; padding: 6px 2px 8px;
    background: rgba(255,255,255,.04); border-radius: 14px;
    border: 1px solid rgba(255,255,255,.06); scrollbar-width: none;
  }
  .hourly-strip::-webkit-scrollbar { display: none; }
  .hourly-item {
    display: flex; flex-direction: column; align-items: center; gap: 5px;
    padding: 8px 10px; border-radius: 10px; min-width: 52px; flex-shrink: 0;
    transition: background .15s;
  }
  .hourly-item:hover { background: rgba(255,255,255,.07); }
  .hourly-time { font-size: .5rem; opacity: .42; }
  .hourly-icon { font-size: 1.05rem; }
  .hourly-temp { font-size: .7rem; font-weight: 700; }

  /* Sun arc */
  .sun-wrap { background: rgba(255,255,255,.04); border-radius: 14px; border: 1px solid rgba(255,255,255,.06); padding: 10px 12px 8px; }
  .sun-canvas { display: block; width: 100%; height: auto; }
  .sun-times { display: flex; justify-content: space-between; padding: 4px 4px 0; font-size: .58rem; opacity: .48; }

  /* Daily */
  .daily-list { background: rgba(255,255,255,.04); border-radius: 14px; border: 1px solid rgba(255,255,255,.06); overflow: hidden; }
  .daily-row { display: grid; grid-template-columns: 52px 28px 1fr; align-items: center; gap: 8px; padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,.04); }
  .daily-row:last-child { border-bottom: none; }
  .daily-day  { font-size: .68rem; font-weight: 600; }
  .daily-icon { font-size: .9rem; text-align: center; }
  .daily-bar-wrap { display: flex; align-items: center; gap: 6px; }
  .daily-min, .daily-max { font-size: .6rem; opacity: .52; min-width: 26px; font-variant-numeric: tabular-nums; }
  .daily-max { opacity: .85; text-align: right; }
  .daily-bar { flex: 1; height: 4px; background: rgba(255,255,255,.1); border-radius: 99px; position: relative; overflow: hidden; }
  .daily-bar-fill { position: absolute; top: 0; bottom: 0; border-radius: 99px; background: linear-gradient(90deg, rgba(var(--accent-rgb,110,231,183),.7), rgba(var(--accent-rgb,110,231,183),1)); }

  /* Theme toggle */
  .theme-toggle-row {
    display: flex; align-items: center; gap: 12px;
    background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.06);
    border-radius: 14px; padding: 14px 16px;
  }
  .theme-toggle-info { flex: 1; }
  .theme-toggle-label { display: block; font-size: .72rem; font-weight: 600; margin-bottom: 2px; }
  .theme-toggle-desc  { display: block; font-size: .58rem; opacity: .42; }
  .toggle-btn {
    width: 42px; height: 24px; border-radius: 99px; border: none; cursor: pointer;
    background: rgba(255,255,255,.12); position: relative; transition: background .2s; flex-shrink: 0;
  }
  .toggle-btn.on { background: var(--accent, #6ee7b7); }
  .toggle-knob {
    position: absolute; top: 3px; left: 3px; width: 18px; height: 18px;
    border-radius: 50%; background: #fff; transition: transform .2s;
    box-shadow: 0 1px 4px rgba(0,0,0,.3);
  }
  .toggle-btn.on .toggle-knob { transform: translateX(18px); }

  /* Location panel */
  .location-panel {
    position: absolute; inset: 0; z-index: 50;
    background: rgba(10,12,20,.97); backdrop-filter: blur(30px);
    display: flex; flex-direction: column;
    animation: slideUp .25s cubic-bezier(.32,0,.15,1);
  }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .location-panel-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 20px 12px; font-size: .78rem; font-weight: 700;
    border-bottom: 1px solid rgba(255,255,255,.07);
  }
  .loc-cancel {
    background: rgba(255,255,255,.08); border: none; border-radius: 7px;
    padding: 5px 12px; font-size: .62rem; color: inherit; cursor: pointer;
  }
  .loc-cancel:hover { background: rgba(255,255,255,.14); }
  .location-panel-body { padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
  .loc-gps-btn {
    display: flex; align-items: center; gap: 12px; padding: 13px 16px;
    background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08);
    border-radius: 12px; color: inherit; cursor: pointer; text-align: left;
  }
  .loc-gps-btn:hover { background: rgba(255,255,255,.1); }
  .loc-gps-btn span:first-child { font-size: 1.3rem; }
  .loc-btn-label { font-size: .72rem; font-weight: 600; }
  .loc-btn-sub   { font-size: .58rem; opacity: .42; }
  .loc-search-wrap { position: relative; }
  .loc-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); opacity: .38; pointer-events: none; }
  .loc-search {
    width: 100%; box-sizing: border-box; padding: 11px 14px 11px 36px;
    background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1);
    border-radius: 10px; color: inherit; font: inherit; font-size: .74rem; outline: none;
  }
  .loc-search:focus { border-color: var(--accent, #6ee7b7); }
  .loc-results { display: flex; flex-direction: column; gap: 4px; max-height: 260px; overflow-y: auto; }
  .loc-result {
    display: flex; flex-direction: column; gap: 2px; padding: 10px 14px;
    background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.06);
    border-radius: 8px; color: inherit; cursor: pointer; text-align: left;
  }
  .loc-result:hover { background: rgba(255,255,255,.09); }
  .loc-result-name { font-size: .7rem; font-weight: 600; }
  .loc-result-sub  { font-size: .58rem; opacity: .42; }
  .loc-loading { font-size: .64rem; opacity: .38; padding: 10px 4px; }

  .weather-empty { font-size: .65rem; opacity: .35; padding: 8px 4px; }
</style>
