<script lang="ts">
  import { goto } from '$app/navigation';
  import type { Tab } from '$lib/types';

  export let tab: Tab;
  export let active = false;
  export let isMobile = false;
</script>

<button
  class="sidebar-tab"
  class:sidebar-tab--active={active}
  class:sidebar-tab--mobile={isMobile}
  on:click={() => goto(tab.path)}
  aria-label={tab.label}
  aria-current={active ? 'page' : undefined}
  title={tab.label}
>
  <span class="sidebar-tab-icon">{tab.icon}</span>
  {#if isMobile}
    <span class="sidebar-tab-label sidebar-tab-label--mobile">{tab.label}</span>
  {:else}
    <span class="sidebar-tab-label">{tab.label}</span>
  {/if}
  {#if active}
    <span class="sidebar-tab-indicator" aria-hidden="true"></span>
  {/if}
</button>

<style>
  .sidebar-tab {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: 48px;
    height: 48px;
    border-radius: 12px;
    border: none;
    background: transparent;
    color: inherit;
    cursor: pointer;
    opacity: .45;
    transition: opacity .15s, background .15s, transform .1s;
    outline: none;
    -webkit-tap-highlight-color: transparent;
  }

  .sidebar-tab:hover { opacity: .75; background: rgba(255,255,255,.06); }
  .sidebar-tab:active { transform: scale(.93); }
  .sidebar-tab--active { opacity: 1; background: rgba(255,255,255,.08); }

  .sidebar-tab--mobile {
    width: auto;
    flex: 1;
    height: 100%;
    border-radius: 0;
    padding: 4px 0;
    background: transparent !important;
  }
  .sidebar-tab--mobile.sidebar-tab--active { opacity: 1; }

  .sidebar-tab-icon { font-size: 1.1rem; line-height: 1; }

  .sidebar-tab-label {
    font-size: .42rem;
    letter-spacing: .04em;
    text-transform: uppercase;
    font-weight: 600;
    opacity: .7;
    white-space: nowrap;
  }
  .sidebar-tab-label--mobile { font-size: .5rem; }

  .sidebar-tab-indicator {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 18px;
    border-radius: 0 3px 3px 0;
    background: var(--accent, #6ee7b7);
  }

  .sidebar-tab--mobile .sidebar-tab-indicator {
    left: 50%;
    top: auto;
    bottom: 0;
    transform: translateX(-50%);
    width: 24px;
    height: 2px;
    border-radius: 2px 2px 0 0;
  }
</style>
