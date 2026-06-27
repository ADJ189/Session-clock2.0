<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { settings } from '$lib/state/settings';

  let phase: 'work' | 'break' = 'work';
  let seconds = 0;
  let running = false;
  let interval = 0;

  $: workSecs  = $settings.pomodoroWork  * 60;
  $: breakSecs = $settings.pomodoroBreak * 60;
  $: totalSecs = phase === 'work' ? workSecs : breakSecs;
  $: if (!running) seconds = totalSecs;

  $: remaining = totalSecs - seconds;
  $: progress  = seconds / totalSecs;
  $: mins = Math.floor(remaining / 60);
  $: secs = remaining % 60;
  $: pct = progress * 100;

  function pad(n: number) { return String(n).padStart(2,'0'); }

  function start() {
    running = true;
    interval = window.setInterval(() => {
      seconds++;
      if (seconds >= totalSecs) {
        running = false;
        clearInterval(interval);
        phase = phase === 'work' ? 'break' : 'work';
        seconds = 0;
      }
    }, 1000);
  }

  function pause() { running = false; clearInterval(interval); }
  function reset() { pause(); seconds = 0; }
  function skip()  { pause(); phase = phase === 'work' ? 'break' : 'work'; seconds = 0; }

  onDestroy(() => clearInterval(interval));
</script>

<svelte:head><title>Focus — Session Clock</title></svelte:head>

<div class="pomo-page">
  <div class="pomo-phase-tabs">
    <button class="pomo-phase-btn" class:active={phase === 'work'}  on:click={() => { reset(); phase = 'work'; }}>Work</button>
    <button class="pomo-phase-btn" class:active={phase === 'break'} on:click={() => { reset(); phase = 'break'; }}>Break</button>
  </div>

  <div class="pomo-ring-wrap">
    <svg class="pomo-ring" viewBox="0 0 200 200">
      <circle class="pomo-ring-track" cx="100" cy="100" r="88" />
      <circle
        class="pomo-ring-fill"
        cx="100" cy="100" r="88"
        stroke-dasharray="553"
        stroke-dashoffset={553 - (553 * progress)}
        transform="rotate(-90 100 100)"
      />
    </svg>
    <div class="pomo-time">{pad(mins)}:{pad(secs)}</div>
    <div class="pomo-label">{phase === 'work' ? 'Focus' : 'Break'}</div>
  </div>

  <div class="pomo-controls">
    {#if !running}
      <button class="pomo-btn pomo-btn--primary" on:click={start}>Start</button>
    {:else}
      <button class="pomo-btn" on:click={pause}>Pause</button>
    {/if}
    <button class="pomo-btn" on:click={reset}>Reset</button>
    <button class="pomo-btn" on:click={skip}>Skip</button>
  </div>

  <div class="pomo-settings-row">
    <label class="pomo-setting">
      <span>Work</span>
      <input type="range" min="5" max="60" step="5" bind:value={$settings.pomodoroWork} on:change={reset} />
      <span>{$settings.pomodoroWork}m</span>
    </label>
    <label class="pomo-setting">
      <span>Break</span>
      <input type="range" min="1" max="30" step="1" bind:value={$settings.pomodoroBreak} on:change={reset} />
      <span>{$settings.pomodoroBreak}m</span>
    </label>
  </div>
</div>

<style>
  .pomo-page { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; padding: 24px; }
  .pomo-phase-tabs { display: flex; gap: 8px; background: rgba(255,255,255,.05); border-radius: 12px; padding: 4px; }
  .pomo-phase-btn { padding: 7px 20px; border-radius: 9px; border: none; background: transparent; color: inherit; font-size: .72rem; font-weight: 600; cursor: pointer; opacity: .5; transition: all .15s; }
  .pomo-phase-btn.active { background: rgba(255,255,255,.1); opacity: 1; }
  .pomo-ring-wrap { position: relative; width: min(200px, 50vw); height: min(200px, 50vw); display: flex; align-items: center; justify-content: center; }
  .pomo-ring { position: absolute; inset: 0; width: 100%; height: 100%; }
  .pomo-ring-track { fill: none; stroke: rgba(255,255,255,.08); stroke-width: 8; }
  .pomo-ring-fill { fill: none; stroke: var(--accent, #6ee7b7); stroke-width: 8; stroke-linecap: round; transition: stroke-dashoffset .9s ease; }
  .pomo-time { font-size: clamp(2rem, 8vw, 3rem); font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: -.02em; }
  .pomo-label { position: absolute; bottom: 22%; font-size: .6rem; opacity: .4; letter-spacing: .08em; text-transform: uppercase; }
  .pomo-controls { display: flex; gap: 10px; }
  .pomo-btn { padding: 10px 22px; border-radius: 10px; border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.06); color: inherit; font-size: .72rem; font-weight: 600; cursor: pointer; transition: background .15s; }
  .pomo-btn:hover { background: rgba(255,255,255,.12); }
  .pomo-btn--primary { background: var(--accent, #6ee7b7); color: #000; border-color: transparent; }
  .pomo-btn--primary:hover { opacity: .88; }
  .pomo-settings-row { display: flex; flex-direction: column; gap: 10px; width: min(320px, 90%); }
  .pomo-setting { display: grid; grid-template-columns: 48px 1fr 36px; align-items: center; gap: 10px; font-size: .65rem; opacity: .6; }
  .pomo-setting input[type=range] { width: 100%; accent-color: var(--accent, #6ee7b7); }
</style>
