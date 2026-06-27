<script lang="ts">
  import { settings } from '$lib/state/settings';

  function clearStorage() {
    if (confirm('Clear all Session Clock data?')) {
      localStorage.clear();
      location.reload();
    }
  }
</script>

<svelte:head><title>Settings — Session Clock</title></svelte:head>

<div class="settings-page">
  <header class="settings-header">
    <h1 class="settings-title">Settings</h1>
  </header>
  <div class="settings-body">

    <section class="settings-section">
      <h2 class="settings-section-label">Appearance</h2>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-info">
            <span class="settings-row-label">Zen Mode</span>
            <span class="settings-row-desc">Hide all UI except the clock</span>
          </div>
          <button class="toggle-btn" class:on={$settings.zenMode} on:click={() => settings.toggle('zenMode')} aria-label="Zen mode"><span class="toggle-knob"></span></button>
        </div>
        <div class="settings-row">
          <div class="settings-row-info">
            <span class="settings-row-label">Reduce motion</span>
            <span class="settings-row-desc">Minimise animations</span>
          </div>
          <button class="toggle-btn" class:on={$settings.reduceMotion} on:click={() => settings.toggle('reduceMotion')} aria-label="Reduce motion"><span class="toggle-knob"></span></button>
        </div>
        <div class="settings-row">
          <div class="settings-row-info">
            <span class="settings-row-label">Weather-adaptive theme</span>
            <span class="settings-row-desc">Blend current conditions into your theme</span>
          </div>
          <button class="toggle-btn" class:on={$settings.weatherAdaptiveTheme} on:click={() => settings.toggle('weatherAdaptiveTheme')} aria-label="Weather adaptive theme"><span class="toggle-knob"></span></button>
        </div>
      </div>
    </section>

    <section class="settings-section">
      <h2 class="settings-section-label">Privacy</h2>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-info">
            <span class="settings-row-label">Privacy mode</span>
            <span class="settings-row-desc">Disable weather, time sync, and analytics</span>
          </div>
          <button class="toggle-btn" class:on={$settings.privacyMode} on:click={() => settings.toggle('privacyMode')} aria-label="Privacy mode"><span class="toggle-knob"></span></button>
        </div>
      </div>
    </section>

    <section class="settings-section">
      <h2 class="settings-section-label">Audio</h2>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-info">
            <span class="settings-row-label">Ambient sound</span>
            <span class="settings-row-desc">Play background soundscapes during focus</span>
          </div>
          <button class="toggle-btn" class:on={$settings.soundEnabled} on:click={() => settings.toggle('soundEnabled')} aria-label="Sound"><span class="toggle-knob"></span></button>
        </div>
        <div class="settings-row">
          <div class="settings-row-info">
            <span class="settings-row-label">Binaural beats</span>
            <span class="settings-row-desc">Brainwave entrainment audio</span>
          </div>
          <button class="toggle-btn" class:on={$settings.binauralEnabled} on:click={() => settings.toggle('binauralEnabled')} aria-label="Binaural"><span class="toggle-knob"></span></button>
        </div>
      </div>
    </section>

    <section class="settings-section">
      <h2 class="settings-section-label">Data</h2>
      <div class="settings-group">
        <button class="settings-danger-btn" on:click={clearStorage}>Clear all data</button>
      </div>
    </section>

    <p class="settings-version">Session Clock · v8.0.0</p>
  </div>
</div>

<style>
  .settings-page { flex: 1; display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
  .settings-header { padding: 18px 20px 12px; border-bottom: 1px solid rgba(255,255,255,.06); flex-shrink: 0; }
  .settings-title { font-size: .9rem; font-weight: 800; }
  .settings-body { flex: 1; overflow-y: auto; padding: 0 16px 24px; }
  .settings-body::-webkit-scrollbar { width: 3px; }
  .settings-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 99px; }
  .settings-section { padding-top: 8px; }
  .settings-section-label { font-size: .52rem; letter-spacing: .1em; text-transform: uppercase; opacity: .32; padding: 14px 4px 8px; font-weight: 600; display: block; }
  .settings-group { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.06); border-radius: 14px; overflow: hidden; }
  .settings-row { display: flex; align-items: center; gap: 12px; padding: 13px 16px; border-bottom: 1px solid rgba(255,255,255,.04); }
  .settings-row:last-child { border-bottom: none; }
  .settings-row-info { flex: 1; }
  .settings-row-label { display: block; font-size: .72rem; font-weight: 600; margin-bottom: 2px; }
  .settings-row-desc  { display: block; font-size: .58rem; opacity: .4; }
  .toggle-btn { width: 42px; height: 24px; border-radius: 99px; border: none; cursor: pointer; background: rgba(255,255,255,.12); position: relative; transition: background .2s; flex-shrink: 0; }
  .toggle-btn.on { background: var(--accent, #6ee7b7); }
  .toggle-knob { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform .2s; box-shadow: 0 1px 4px rgba(0,0,0,.3); }
  .toggle-btn.on .toggle-knob { transform: translateX(18px); }
  .settings-danger-btn { margin: 12px 16px; padding: 10px 16px; background: rgba(255,80,80,.1); border: 1px solid rgba(255,80,80,.2); border-radius: 9px; color: rgba(255,130,130,1); font-size: .7rem; font-weight: 600; cursor: pointer; }
  .settings-danger-btn:hover { background: rgba(255,80,80,.18); }
  .settings-version { font-size: .55rem; opacity: .2; padding: 20px 4px 0; text-align: center; }
</style>
