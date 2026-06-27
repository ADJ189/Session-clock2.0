<script lang="ts">
  // Clock route — main canvas + UI
  import { onMount } from 'svelte';
  import { settings } from '$lib/state/settings';
  import { weatherData } from '$lib/state/weather';

  let greeting = 'Good morning';
  let timeDisplay = '--:--:--';
  let utcDisplay = 'UTC --:--:--';
  let dateDisplay = '';

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    if (h < 21) return 'Good evening';
    return 'Good night';
  }

  function pad(n: number) { return String(n).padStart(2, '0'); }

  function tick() {
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
    const utcH = now.getUTCHours(), utcM = now.getUTCMinutes(), utcS = now.getUTCSeconds();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    timeDisplay = `${pad(h12)}:${pad(m)}:${pad(s)} ${ampm}`;
    utcDisplay = `UTC ${pad(utcH)}:${pad(utcM)}:${pad(utcS)}`;
    dateDisplay = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    greeting = getGreeting();
  }

  onMount(() => {
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  });
</script>

<svelte:head><title>Clock — Session Clock</title></svelte:head>

<div class="clock-page" class:zen={$settings.zenMode}>
  {#if !$settings.zenMode}
    <p class="greeting">{greeting}</p>
  {/if}

  <div class="clock-display">
    <div class="time-main">{timeDisplay}</div>
    <div class="date-line">{dateDisplay}</div>
  </div>

  {#if !$settings.zenMode}
    <div class="clock-meta">
      <span class="utc-pill">{utcDisplay}</span>
      {#if $weatherData.temp !== null}
        <span class="weather-inline">{$weatherData.icon} {$weatherData.temp}° · {$weatherData.desc}</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .clock-page {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 32px;
    min-height: 0;
  }

  .greeting {
    font-size: clamp(.7rem, 2vw, .9rem);
    letter-spacing: .2em;
    text-transform: uppercase;
    opacity: .4;
    font-weight: 500;
  }

  .clock-display {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .time-main {
    font-size: clamp(2.8rem, 10vw, 7rem);
    font-weight: 800;
    letter-spacing: -.02em;
    font-variant-numeric: tabular-nums;
    background: linear-gradient(135deg, var(--fg, #e8e0f0) 60%, rgba(255,255,255,.4));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1;
  }

  .date-line {
    font-size: clamp(.65rem, 1.5vw, .85rem);
    opacity: .4;
    letter-spacing: .06em;
  }

  .clock-meta {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 8px;
  }

  .utc-pill {
    font-size: .6rem;
    font-variant-numeric: tabular-nums;
    opacity: .35;
    letter-spacing: .08em;
    padding: 3px 8px;
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 6px;
  }

  .weather-inline {
    font-size: .65rem;
    opacity: .45;
    letter-spacing: .03em;
  }

  .zen .greeting,
  .zen .clock-meta { display: none; }
</style>
