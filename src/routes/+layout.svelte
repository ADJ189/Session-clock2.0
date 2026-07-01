<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { settings } from '$lib/state/settings';
  import { currentTheme } from '$lib/state/theme';
  import { initWeatherService } from '$lib/state/weather';
  import '../app.css';

  const tabs = [
    { id: 'clock',    path: '/',         label: 'Clock',   icon: '⏱' },
    { id: 'weather',  path: '/weather',  label: 'Weather', icon: '🌤' },
    { id: 'pomodoro', path: '/pomodoro', label: 'Focus',   icon: '🍅' },
    { id: 'settings', path: '/settings', label: 'Settings',icon: '⚙' },
  ];

  let isMobile = false;
  $: activePath = $page.url.pathname;
  $: theme = $currentTheme;

  // Convert a theme's accent hex to "r, g, b" for rgba() usage in CSS
  function hexToRgb(hex: string): string {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const n = parseInt(full.slice(0, 6), 16);
    if (Number.isNaN(n)) return '110, 231, 183';
    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
  }
  $: accentRgb = hexToRgb(theme.accent);

  onMount(() => {
    isMobile = window.innerWidth <= 600;
    window.addEventListener('resize', () => { isMobile = window.innerWidth <= 600; });

    if (!$settings.privacyMode) {
      initWeatherService(() => $settings.privacyMode);
    }

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) settings.setKey('reduceMotion', true);
    mq.addEventListener('change', e => settings.setKey('reduceMotion', e.matches));
  });
</script>

<!-- Theme-driven CSS custom properties, consumed by weather/pomodoro/settings pages -->
<div
  id="sc-root"
  style="
    --accent:{theme.accent};
    --accent-rgb:{accentRgb};
    --bg:{theme.baseBg[0]};
    --fg:{theme.text};
    background:{theme.baseBg[0]};
    color:{theme.text};
    font-family:{theme.font};
  "
>
  <!-- Sidebar / Bottom nav -->
  {#if !$settings.zenMode}
  <nav
    class="sc-nav"
    class:sc-nav--side={!isMobile}
    class:sc-nav--bottom={isMobile}
    style="background:{theme.panel}; border-color:rgba(255,255,255,.07);"
    aria-label="Main navigation"
  >
    {#each tabs as tab}
      <a
        href={tab.path}
        class="sc-tab"
        class:sc-tab--active={activePath === tab.path}
        style={activePath === tab.path
          ? `color:${theme.accent}; background:${theme.btnBg};`
          : `color:${theme.text}; opacity:.45;`}
        aria-label={tab.label}
        aria-current={activePath === tab.path ? 'page' : undefined}
      >
        <span class="sc-tab-icon">{tab.icon}</span>
        <span class="sc-tab-label">{tab.label}</span>
      </a>
    {/each}
  </nav>
  {/if}

  <!-- Route content (clock page renders its own full-screen canvas, other pages are overlaid) -->
  <main
    class="sc-content"
    class:sc-content--side={!isMobile && !$settings.zenMode}
    class:sc-content--bottom={isMobile && !$settings.zenMode}
    class:sc-content--zen={$settings.zenMode}
  >
    <slot />
  </main>
</div>

<style>
  :global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(html, body) { height: 100%; overflow: hidden; }

  #sc-root {
    position: fixed; inset: 0;
    transition: background .4s ease, color .4s ease;
  }

  .sc-nav {
    position: fixed; z-index: 50;
    display: flex;
    border-style: solid;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
  .sc-nav--side {
    top: 0; left: 0; bottom: 0;
    width: var(--sidebar-w, 64px);
    flex-direction: column; align-items: center;
    padding: 16px 0; gap: 4px;
    border-right-width: 1px; border-top-width: 0; border-bottom-width: 0; border-left-width: 0;
  }
  .sc-nav--bottom {
    bottom: 0; left: 0; right: 0;
    height: var(--sidebar-h, 56px);
    flex-direction: row; justify-content: space-around; align-items: center;
    padding: 0 4px; border-top-width: 1px; border-bottom-width: 0;
    border-left-width: 0; border-right-width: 0;
  }

  .sc-tab {
    display: flex; flex-direction: column; align-items: center;
    gap: 3px; padding: 8px 6px; border-radius: 10px;
    text-decoration: none; transition: all .15s;
    font-family: inherit; cursor: pointer; border: none;
  }
  .sc-nav--side .sc-tab { width: 48px; }
  .sc-nav--bottom .sc-tab { flex: 1; max-width: 72px; padding: 5px 4px; }
  .sc-tab-icon { font-size: 1.1rem; line-height: 1; }
  .sc-tab-label { font-size: .45rem; letter-spacing: .06em; text-transform: uppercase; font-weight: 600; }
  .sc-tab--active { opacity: 1 !important; }

  .sc-content { position: fixed; inset: 0; z-index: 10; overflow: hidden; }
  .sc-content--side { left: var(--sidebar-w, 64px); }
  .sc-content--bottom { bottom: var(--sidebar-h, 56px); }
  .sc-content--zen { inset: 0; }
</style>
