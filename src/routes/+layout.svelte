<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { settings } from '$lib/state/settings';
  import { activeWeatherClass } from '$lib/state/theme';
  import { initWeatherService } from '$lib/state/weather';
  import Sidebar from '$components/sidebar/Sidebar.svelte';
  import '../app.css';

  let mounted = false;
  let isMobile = false;

  $: weatherClass = $activeWeatherClass;

  onMount(() => {
    mounted = true;
    isMobile = window.innerWidth <= 600;

    const handleResize = () => { isMobile = window.innerWidth <= 600; };
    window.addEventListener('resize', handleResize);

    // Init weather (silent — no popups)
    initWeatherService(() => $settings.privacyMode);

    // Reduce motion preference
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) settings.setKey('reduceMotion', true);
    mq.addEventListener('change', e => settings.setKey('reduceMotion', e.matches));

    return () => window.removeEventListener('resize', handleResize);
  });
</script>

<div
  id="sc-root"
  data-mobile={isMobile}
  data-reduce-motion={$settings.reduceMotion}
  data-zen={$settings.zenMode}
  class={weatherClass}
>
  <Sidebar {isMobile} />

  <div class="sc-content" class:sc-content--mobile={isMobile}>
    <slot />
  </div>
</div>

<style>
  :global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(html, body) { height: 100%; overflow: hidden; }

  #sc-root {
    display: grid;
    grid-template-columns: var(--sidebar-w, 64px) 1fr;
    grid-template-rows: 1fr;
    height: 100dvh;
    width: 100vw;
    overflow: hidden;
    background: var(--bg, #06030f);
    color: var(--fg, #e8e0f0);
    font-family: 'Inter', system-ui, sans-serif;
  }

  #sc-root[data-mobile='true'] {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr var(--sidebar-h, 56px);
  }

  .sc-content {
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .sc-content--mobile {
    order: -1;
  }

  /* Weather overlay classes applied to root */
  :global(#sc-root.weather-rain::after) {
    content: '';
    position: fixed; inset: 0; z-index: 5;
    pointer-events: none;
    background-image: repeating-linear-gradient(
      175deg, transparent 0px, transparent 6px,
      rgba(var(--accent-rgb, 110,231,183), .04) 6px,
      rgba(var(--accent-rgb, 110,231,183), .04) 7px
    );
    animation: globalRain 1.2s linear infinite;
  }
  @keyframes globalRain {
    from { background-position: 0 -100vh; }
    to   { background-position: 0 100vh; }
  }

  :global(#sc-root.weather-thunder::after) {
    content: '';
    position: fixed; inset: 0; z-index: 5; pointer-events: none;
    animation: globalThunder 6s ease-in-out infinite;
  }
  @keyframes globalThunder {
    0%,82%,90%,100% { background: rgba(140,80,255,0); }
    83%,89%          { background: rgba(140,80,255,.05); }
  }

  :global(#sc-root.weather-snow::after) {
    content: '· · · · · · ·';
    position: fixed; inset: 0; z-index: 5; pointer-events: none;
    font-size: 1.6rem; letter-spacing: 50px; line-height: 4;
    color: rgba(220,235,255,.1);
    animation: globalSnow 9s linear infinite; overflow: hidden;
  }
  @keyframes globalSnow {
    from { transform: translateY(-80px) translateX(-15px); }
    to   { transform: translateY(calc(100vh + 80px)) translateX(15px); }
  }

  :global(#sc-root.weather-fog::after) {
    content: '';
    position: fixed; inset: 0; z-index: 5; pointer-events: none;
    background: radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(140,150,170,.07) 100%);
    animation: globalFog 7s ease-in-out infinite alternate;
  }
  @keyframes globalFog {
    from { opacity: .5; }
    to   { opacity: 1; }
  }
</style>
