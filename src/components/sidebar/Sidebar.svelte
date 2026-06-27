<script lang="ts">
  import { page } from '$app/stores';
  import { tabs } from '$lib/state/nav';
  import SidebarTab from './SidebarTab.svelte';
  import SidebarLogo from './SidebarLogo.svelte';
  import { weatherData } from '$lib/state/weather';

  export let isMobile = false;
</script>

<nav class="sidebar" class:sidebar--mobile={isMobile} aria-label="Main navigation">
  {#if !isMobile}
    <div class="sidebar-logo-wrap">
      <SidebarLogo />
    </div>
  {/if}

  <div class="sidebar-tabs">
    {#each tabs as tab}
      <SidebarTab {tab} active={$page.url.pathname === tab.path} {isMobile} />
    {/each}
  </div>

  {#if !isMobile}
    <div class="sidebar-weather-pill" title={$weatherData.desc || 'Weather'}>
      <span class="sidebar-weather-icon">{$weatherData.icon}</span>
      <span class="sidebar-weather-temp">{$weatherData.temp !== null ? `${$weatherData.temp}°` : '--°'}</span>
    </div>
  {/if}
</nav>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px 0;
    background: rgba(255,255,255,.03);
    border-right: 1px solid rgba(255,255,255,.06);
    width: var(--sidebar-w, 64px);
    height: 100%;
    position: relative;
    z-index: 100;
    overflow: hidden;
  }

  .sidebar--mobile {
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    width: 100%;
    height: var(--sidebar-h, 56px);
    border-right: none;
    border-top: 1px solid rgba(255,255,255,.06);
    padding: 0 8px;
    padding-bottom: env(safe-area-inset-bottom, 0);
  }

  .sidebar-logo-wrap {
    padding-bottom: 8px;
    margin-bottom: 4px;
    border-bottom: 1px solid rgba(255,255,255,.06);
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .sidebar-tabs {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    width: 100%;
    align-items: center;
  }

  .sidebar--mobile .sidebar-tabs {
    flex-direction: row;
    justify-content: space-around;
    width: 100%;
    flex: 1;
    gap: 0;
  }

  .sidebar-weather-pill {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 4px;
    border-top: 1px solid rgba(255,255,255,.06);
    width: 100%;
    cursor: default;
  }

  .sidebar-weather-icon { font-size: .95rem; }
  .sidebar-weather-temp { font-size: .52rem; opacity: .6; font-variant-numeric: tabular-nums; }
</style>
