<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { settings } from '$lib/state/settings';
  import { currentTheme, weatherOverlayActive, THEMES, CAT_LABELS, NAT_QUOTES, type ThemeCat } from '$lib/state/theme';
  import { weatherData } from '$lib/state/weather';
  import { initRenderer, resize, drawBg, buildParticles, invalidateCache } from '$lib/renderer';
  import { initPerf, getTier, setTier, type QualityTier } from '$lib/perf';
  import type { Theme } from '$lib/types';

  // DOM refs
  let bgCanvas: HTMLCanvasElement;
  let transCanvas: HTMLCanvasElement;
  let grainEl: HTMLElement;

  // Clock state
  let timeDisplay = '--:--:--';
  let dateDisplay = '';
  let greeting = 'Good morning';
  let quoteText = '';
  let quoteTimer = 0;

  // Theme picker
  let pickerOpen = false;
  let pickerCat: ThemeCat = 'nat';

  // RAF handle
  let rafId = 0;
  let lastT = 0;
  let destroyed = false;

  const CATS = Object.entries(CAT_LABELS) as [ThemeCat, string][];

  function pad(n: number) { return String(n).padStart(2, '0'); }

  function updateClock() {
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
    const h12 = h % 12 || 12;
    timeDisplay = `${pad(h12)}:${pad(m)}:${pad(s)} ${h >= 12 ? 'PM' : 'AM'}`;
    dateDisplay = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    if (h < 5 || h >= 21) greeting = 'Good night';
    else if (h < 12) greeting = 'Good morning';
    else if (h < 17) greeting = 'Good afternoon';
    else greeting = 'Good evening';
  }

  function pickQuote(theme: Theme) {
    const pool = theme.quotes?.length ? theme.quotes : NAT_QUOTES;
    return pool[Math.floor(Math.random() * pool.length)] ?? '';
  }

  function selectTheme(id: string) {
    settings.setKey('currentThemeId', id);
    pickerOpen = false;
    // Rebuild particles for new theme
    setTimeout(() => {
      invalidateCache();
      buildParticles($currentTheme);
      quoteText = pickQuote($currentTheme);
    }, 50);
  }

  let clockInterval = 0;

  onMount(() => {
    initPerf();
    initRenderer(bgCanvas, transCanvas, grainEl);
    resize();
    buildParticles($currentTheme);
    updateClock();
    quoteText = pickQuote($currentTheme);

    clockInterval = window.setInterval(() => {
      updateClock();
      quoteTimer++;
      if (quoteTimer % 120 === 0) quoteText = pickQuote($currentTheme);
    }, 1000);

    window.addEventListener('resize', () => { resize(); buildParticles($currentTheme); });

    function loop(t: number) {
      if (destroyed) return;
      const dt = Math.min((t - lastT) / 1000, 0.05);
      lastT = t;
      drawBg(dt, $currentTheme, 0);
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(t => { lastT = t; rafId = requestAnimationFrame(loop); });
  });

  onDestroy(() => {
    destroyed = true;
    if (typeof window === 'undefined') return;
    clearInterval(clockInterval);
    cancelAnimationFrame(rafId);
  });

  $: theme = $currentTheme;
  $: themesBycat = (cat: ThemeCat) => THEMES.filter(t => t.cat === cat);
</script>

<svelte:head>
  <title>Clock — Session Clock</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Orbitron:wght@400;700;900&family=Cinzel:wght@400;700&family=Josefin+Sans:wght@300;400;600&family=Playfair+Display:wght@400;700&family=Bebas+Neue&family=Teko:wght@400;600&family=Special+Elite&family=Fraunces:wght@400;700&family=Comfortaa:wght@400;700&family=Nunito:wght@400;700&family=Fredoka+One&family=Share+Tech+Mono&family=Noto+Serif+JP:wght@400;700&family=IM+Fell+English&family=Lora:wght@400;700&display=swap');
  </style>
</svelte:head>

<!-- Canvas layers -->
<canvas bind:this={bgCanvas} class="layer layer-bg"></canvas>
<canvas bind:this={transCanvas} class="layer layer-trans"></canvas>
<div class="layer layer-grain" bind:this={grainEl} class:grain-on={theme.grain}></div>
{#if theme.scanlines}<div class="layer scanlines" aria-hidden="true"></div>{/if}
{#if theme.lb}<div class="letterbox letterbox-top" aria-hidden="true"></div><div class="letterbox letterbox-bot" aria-hidden="true"></div>{/if}

<!-- CSS overlay / vignette from theme -->
<div class="layer theme-overlay" style="background:{theme.overlay};" aria-hidden="true"></div>
<div class="layer theme-vignette" style="background:{theme.vignette};" aria-hidden="true"></div>

<!-- Clock UI -->
<div class="clock-page" class:zen={$settings.zenMode}
  style="color:{theme.text}; font-family:{theme.font};">

  {#if !$settings.zenMode}
    <p class="greeting">{greeting}</p>
  {/if}

  <div class="clock-display">
    <div class="time-main" style="text-shadow:{theme.glow};">{timeDisplay}</div>
    <div class="date-line">{dateDisplay}</div>
  </div>

  {#if !$settings.zenMode}
    <div class="clock-meta">
      {#if $weatherData.temp !== null}
        <span class="weather-pill">{$weatherData.icon} {$weatherData.temp}° · {$weatherData.desc}</span>
      {/if}
      {#if theme.tagline}
        <span class="tagline-pill">{theme.tagline}</span>
      {/if}
    </div>

    {#if quoteText}
      <p class="quote" style="color:{theme.accent2};">{quoteText}</p>
    {/if}
  {/if}

  <!-- Theme picker button -->
  {#if !$settings.zenMode}
    <button
      class="theme-btn"
      style="background:{theme.btnBg}; color:{theme.btnFg}; border-color:rgba(255,255,255,.08);"
      on:click={() => pickerOpen = !pickerOpen}
      aria-label="Change theme"
    >
      <span class="theme-btn-swatch" style="background:{theme.swatch ?? theme.accent};"></span>
      {theme.name}
      <span class="theme-btn-arrow">{pickerOpen ? '▲' : '▼'}</span>
    </button>
  {/if}
</div>

<!-- Theme Picker Panel -->
{#if pickerOpen}
  <div
    class="picker-backdrop"
    role="button"
    tabindex="-1"
    aria-label="Close theme picker"
    on:click={() => pickerOpen = false}
    on:keydown={e => e.key === 'Escape' && (pickerOpen = false)}
  ></div>
  <div class="picker-panel" style="background:{theme.panel}; border-color:rgba(255,255,255,.08);">
    <div class="picker-header">
      <span class="picker-title" style="color:{theme.text};">🎨 Themes</span>
      <button class="picker-close" on:click={() => pickerOpen = false} aria-label="Close">✕</button>
    </div>

    <!-- Category tabs -->
    <div class="picker-cats">
      {#each CATS as [cat, label]}
        <button
          class="picker-cat-btn"
          class:active={pickerCat === cat}
          style={pickerCat === cat ? `background:${theme.btnBg}; color:${theme.accent};` : `color:${theme.text}; opacity:.5;`}
          on:click={() => pickerCat = cat}
        >{label}</button>
      {/each}
    </div>

    <!-- Theme grid -->
    <div class="picker-grid">
      {#each themesBycat(pickerCat) as t (t.id)}
        <button
          class="picker-item"
          class:active={t.id === $settings.currentThemeId}
          style={t.id === $settings.currentThemeId ? `border-color:${theme.accent};` : ''}
          on:click={() => selectTheme(t.id)}
          title={t.tagline ?? t.name}
        >
          <span class="picker-swatch" style="background:{t.swatch ?? t.accent};"></span>
          <span class="picker-name" style="color:{theme.text};">{t.name}</span>
          {#if t.sub}<span class="picker-sub">{t.sub}</span>{/if}
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .layer { position: fixed; inset: 0; pointer-events: none; }
  .layer-bg, .layer-trans { z-index: 0; }
  .layer-grain { z-index: 1; opacity: 0; }
  .grain-on {
    opacity: 0.18;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
    background-size: 128px 128px;
    mix-blend-mode: overlay;
  }
  .scanlines {
    z-index: 2;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.06) 2px, rgba(0,0,0,.06) 4px);
  }
  .letterbox { position: fixed; left: 0; right: 0; z-index: 3; background: #000; pointer-events: none; }
  .letterbox-top { top: 0; height: 9vh; }
  .letterbox-bot { bottom: 0; height: 9vh; }
  .theme-overlay, .theme-vignette { z-index: 2; }

  .clock-page {
    position: fixed; inset: 0; z-index: 10;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 16px; padding: 32px;
    pointer-events: none;
    padding-left: calc(var(--sidebar-w, 64px) + 32px);
  }
  @media (max-width: 600px) {
    .clock-page { padding: 24px 20px calc(var(--sidebar-h, 56px) + 24px); }
  }

  .greeting {
    font-size: clamp(.65rem, 1.8vw, .85rem);
    letter-spacing: .22em; text-transform: uppercase;
    opacity: .38; font-weight: 500;
  }
  .clock-display { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .time-main {
    font-size: clamp(2.6rem, 9.5vw, 7rem);
    font-weight: 800; letter-spacing: -.02em;
    font-variant-numeric: tabular-nums; line-height: 1;
  }
  .date-line { font-size: clamp(.6rem, 1.4vw, .82rem); opacity: .38; letter-spacing: .06em; }
  .clock-meta { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; align-items: center; }
  .weather-pill, .tagline-pill {
    font-size: .6rem; opacity: .52; letter-spacing: .04em;
    padding: 3px 9px; border: 1px solid rgba(255,255,255,.09);
    border-radius: 6px;
  }
  .quote {
    font-size: clamp(.58rem, 1.1vw, .75rem);
    max-width: 520px; text-align: center;
    opacity: .6; line-height: 1.6;
    font-style: italic; letter-spacing: .02em;
  }

  /* Theme button */
  .theme-btn {
    pointer-events: all;
    display: flex; align-items: center; gap: 8px;
    padding: 7px 14px; border-radius: 10px;
    border: 1px solid; cursor: pointer;
    font-size: .65rem; font-weight: 600;
    letter-spacing: .04em; transition: opacity .15s;
    margin-top: 8px;
  }
  .theme-btn:hover { opacity: .78; }
  .theme-btn-swatch {
    width: 14px; height: 14px; border-radius: 4px; flex-shrink: 0;
  }
  .theme-btn-arrow { opacity: .5; font-size: .55rem; }

  /* Picker */
  .picker-backdrop {
    position: fixed; inset: 0; z-index: 90;
    background: transparent; cursor: default;
  }
  .picker-panel {
    position: fixed; z-index: 100;
    left: calc(var(--sidebar-w, 64px) + 12px);
    bottom: 12px; right: 12px; max-width: 720px;
    border-radius: 18px; border: 1px solid;
    overflow: hidden; display: flex; flex-direction: column;
    max-height: min(520px, 85vh);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
  }
  @media (max-width: 600px) {
    .picker-panel { left: 8px; right: 8px; bottom: calc(var(--sidebar-h, 56px) + 8px); }
  }
  .picker-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 16px 10px; flex-shrink: 0;
    border-bottom: 1px solid rgba(255,255,255,.06);
  }
  .picker-title { font-size: .78rem; font-weight: 700; }
  .picker-close {
    background: rgba(255,255,255,.07); border: none; border-radius: 6px;
    color: inherit; cursor: pointer; padding: 3px 8px; font-size: .7rem;
  }
  .picker-cats {
    display: flex; gap: 4px; padding: 8px 12px; overflow-x: auto;
    flex-shrink: 0; border-bottom: 1px solid rgba(255,255,255,.05);
    scrollbar-width: none;
  }
  .picker-cats::-webkit-scrollbar { display: none; }
  .picker-cat-btn {
    padding: 5px 12px; border-radius: 8px; border: none;
    cursor: pointer; font-size: .6rem; font-weight: 600;
    letter-spacing: .05em; white-space: nowrap;
    background: transparent; transition: all .12s;
  }
  .picker-cat-btn.active { opacity: 1 !important; }

  .picker-grid {
    flex: 1; overflow-y: auto; padding: 10px 12px 12px;
    display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 7px;
    scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.12) transparent;
  }
  .picker-item {
    display: flex; flex-direction: column; gap: 5px;
    padding: 9px 10px; border-radius: 10px;
    border: 1.5px solid rgba(255,255,255,.06);
    background: rgba(255,255,255,.04); cursor: pointer;
    transition: all .14s; text-align: left;
  }
  .picker-item:hover { background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.14); }
  .picker-item.active { background: rgba(255,255,255,.09); }
  .picker-swatch { width: 100%; height: 28px; border-radius: 6px; }
  .picker-name { font-size: .64rem; font-weight: 600; line-height: 1.3; }
  .picker-sub { font-size: .53rem; opacity: .42; }

  /* Zen: hide everything except time */
  .zen .greeting, .zen .clock-meta, .zen .quote, .zen .theme-btn { display: none !important; }
</style>
