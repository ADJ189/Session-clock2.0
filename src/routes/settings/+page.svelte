<script lang="ts">
  import { settings } from '$lib/state/settings';
  import { currentTheme } from '$lib/state/theme';
  import { setTier, getTier } from '$lib/perf';
  import type { QualityTier } from '$lib/perf';

  $: theme = $currentTheme;
  $: accent = theme.accent;

  const qualityOptions: { value: QualityTier | 'auto'; label: string; desc: string }[] = [
    { value: 'auto',  label: 'Auto',   desc: 'Detect your device capability' },
    { value: 'high',  label: 'High',   desc: 'Full particles & glow — powerful devices' },
    { value: 'med',   label: 'Medium', desc: 'Balanced — 30fps for heavy effects' },
    { value: 'low',   label: 'Low',    desc: 'Minimal — older/mobile devices' },
  ];

  function clearStorage() {
    if (confirm('Clear all Session Clock data? This cannot be undone.')) {
      localStorage.clear();
      location.reload();
    }
  }

  function setQuality(v: QualityTier | 'auto') {
    settings.setKey('qualityTier', v);
    if (v !== 'auto') setTier(v as QualityTier);
    else localStorage.removeItem('sc_quality');
  }
</script>

<svelte:head><title>Settings — Session Clock</title></svelte:head>

<div class="settings-page" style="--accent:{accent}; color:{theme.text};">
  <header class="settings-header">
    <h1 class="settings-title">Settings</h1>
    <p class="settings-subtitle">{theme.name} theme active</p>
  </header>

  <div class="settings-body">

    <!-- Appearance -->
    <section class="settings-section">
      <h2 class="settings-section-label">Appearance</h2>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-info">
            <span class="settings-row-label">Zen Mode</span>
            <span class="settings-row-desc">Hide all UI, show only the clock face</span>
          </div>
          <button class="toggle-btn" class:on={$settings.zenMode}
            style={$settings.zenMode ? `background:${accent}` : ''}
            on:click={() => settings.toggle('zenMode')} aria-label="Zen mode">
            <span class="toggle-knob"></span>
          </button>
        </div>
        <div class="settings-row">
          <div class="settings-row-info">
            <span class="settings-row-label">Reduce motion</span>
            <span class="settings-row-desc">Minimise animations for accessibility</span>
          </div>
          <button class="toggle-btn" class:on={$settings.reduceMotion}
            style={$settings.reduceMotion ? `background:${accent}` : ''}
            on:click={() => settings.toggle('reduceMotion')} aria-label="Reduce motion">
            <span class="toggle-knob"></span>
          </button>
        </div>
        <div class="settings-row">
          <div class="settings-row-info">
            <span class="settings-row-label">Weather-adaptive colours</span>
            <span class="settings-row-desc">Blend current conditions into the theme</span>
          </div>
          <button class="toggle-btn" class:on={$settings.weatherAdaptiveTheme}
            style={$settings.weatherAdaptiveTheme ? `background:${accent}` : ''}
            on:click={() => settings.toggle('weatherAdaptiveTheme')} aria-label="Weather adaptive">
            <span class="toggle-knob"></span>
          </button>
        </div>
      </div>
    </section>

    <!-- Render quality -->
    <section class="settings-section">
      <h2 class="settings-section-label">Render Quality</h2>
      <div class="settings-group quality-group">
        {#each qualityOptions as opt}
          <button
            class="quality-btn"
            class:active={$settings.qualityTier === opt.value}
            style={$settings.qualityTier === opt.value ? `border-color:${accent}; color:${accent};` : ''}
            on:click={() => setQuality(opt.value)}
          >
            <span class="quality-label">{opt.label}</span>
            <span class="quality-desc">{opt.desc}</span>
          </button>
        {/each}
      </div>
    </section>

    <!-- Pomodoro -->
    <section class="settings-section">
      <h2 class="settings-section-label">Pomodoro Timer</h2>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-info">
            <span class="settings-row-label">Work duration</span>
            <span class="settings-row-desc">{$settings.pomodoroWork} minutes per session</span>
          </div>
          <input type="range" min="5" max="90" step="5"
            bind:value={$settings.pomodoroWork}
            style="accent-color:{accent}"
            class="range-input" />
        </div>
        <div class="settings-row">
          <div class="settings-row-info">
            <span class="settings-row-label">Break duration</span>
            <span class="settings-row-desc">{$settings.pomodoroBreak} minutes per break</span>
          </div>
          <input type="range" min="1" max="30" step="1"
            bind:value={$settings.pomodoroBreak}
            style="accent-color:{accent}"
            class="range-input" />
        </div>
      </div>
    </section>

    <!-- Privacy -->
    <section class="settings-section">
      <h2 class="settings-section-label">Privacy</h2>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-info">
            <span class="settings-row-label">Privacy mode</span>
            <span class="settings-row-desc">Disable weather and all network requests</span>
          </div>
          <button class="toggle-btn" class:on={$settings.privacyMode}
            style={$settings.privacyMode ? `background:${accent}` : ''}
            on:click={() => settings.toggle('privacyMode')} aria-label="Privacy mode">
            <span class="toggle-knob"></span>
          </button>
        </div>
      </div>
    </section>

    <!-- Data -->
    <section class="settings-section">
      <h2 class="settings-section-label">Data</h2>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-info">
            <span class="settings-row-label">Clear all data</span>
            <span class="settings-row-desc">Reset settings, theme, weather preferences</span>
          </div>
          <button class="danger-btn" on:click={clearStorage}>Clear</button>
        </div>
      </div>
    </section>

    <p class="settings-version">Session Clock · v8.0.0 · 63+ themes</p>
  </div>
</div>

<style>
  .settings-page {
    position: fixed; inset: 0;
    display: flex; flex-direction: column;
    overflow: hidden;
  }
  .settings-header {
    padding: 18px 20px 12px;
    border-bottom: 1px solid rgba(255,255,255,.06);
    flex-shrink: 0;
  }
  .settings-title { font-size: .9rem; font-weight: 800; }
  .settings-subtitle { font-size: .58rem; opacity: .3; margin-top: 3px; }
  .settings-body {
    flex: 1; overflow-y: auto; padding: 4px 16px 32px;
    scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.1) transparent;
  }
  .settings-body::-webkit-scrollbar { width: 3px; }
  .settings-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 99px; }
  .settings-section { padding-top: 6px; }
  .settings-section-label {
    font-size: .5rem; letter-spacing: .1em; text-transform: uppercase;
    opacity: .3; padding: 14px 4px 8px; font-weight: 700; display: block;
  }
  .settings-group {
    background: rgba(255,255,255,.03);
    border: 1px solid rgba(255,255,255,.06);
    border-radius: 14px; overflow: hidden;
  }
  .settings-row {
    display: flex; align-items: center; gap: 14px;
    padding: 13px 16px;
    border-bottom: 1px solid rgba(255,255,255,.04);
  }
  .settings-row:last-child { border-bottom: none; }
  .settings-row-info { flex: 1; min-width: 0; }
  .settings-row-label { display: block; font-size: .71rem; font-weight: 600; margin-bottom: 2px; }
  .settings-row-desc  { display: block; font-size: .57rem; opacity: .38; line-height: 1.4; }

  /* Toggle */
  .toggle-btn {
    width: 42px; height: 24px; border-radius: 99px; border: none;
    cursor: pointer; background: rgba(255,255,255,.1);
    position: relative; transition: background .2s; flex-shrink: 0;
  }
  .toggle-knob {
    position: absolute; top: 3px; left: 3px;
    width: 18px; height: 18px; border-radius: 50%;
    background: #fff; transition: transform .2s;
    box-shadow: 0 1px 4px rgba(0,0,0,.35);
  }
  .toggle-btn.on .toggle-knob { transform: translateX(18px); }

  /* Range */
  .range-input { width: 100px; flex-shrink: 0; }
  @media (max-width: 400px) { .range-input { width: 70px; } }

  /* Quality */
  .quality-group { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
  .quality-btn {
    display: flex; flex-direction: column; gap: 3px;
    padding: 12px 14px; text-align: left;
    background: transparent; border: none;
    border-bottom: 1px solid rgba(255,255,255,.04);
    border-right: 1px solid rgba(255,255,255,.04);
    cursor: pointer; color: inherit;
    border-left: 2px solid transparent;
    transition: all .12s;
  }
  .quality-btn:nth-child(2n) { border-right: none; }
  .quality-btn:nth-last-child(-n+2) { border-bottom: none; }
  .quality-btn:hover { background: rgba(255,255,255,.04); }
  .quality-btn.active { background: rgba(255,255,255,.05); border-left-width: 2px; }
  .quality-label { font-size: .7rem; font-weight: 700; }
  .quality-desc  { font-size: .55rem; opacity: .38; line-height: 1.4; }

  /* Danger */
  .danger-btn {
    padding: 7px 14px; border-radius: 8px; flex-shrink: 0;
    background: rgba(255,70,70,.1); border: 1px solid rgba(255,70,70,.2);
    color: rgba(255,120,120,1); font-size: .65rem; font-weight: 600;
    cursor: pointer; transition: background .15s;
  }
  .danger-btn:hover { background: rgba(255,70,70,.2); }

  .settings-version { font-size: .5rem; opacity: .18; padding: 24px 4px 0; text-align: center; }
</style>
