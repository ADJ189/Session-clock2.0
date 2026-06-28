<script lang="ts">
  interface LogEntry { date: string; duration: number; note: string; }
  let entries: LogEntry[] = [];
  let newNote = '';

  if (typeof localStorage !== 'undefined') {
    try { entries = JSON.parse(localStorage.getItem('sc_focus_log_v2') || '[]'); } catch {}
  }

  function addEntry() {
    if (!newNote.trim()) return;
    const entry = { date: new Date().toISOString(), duration: 25, note: newNote.trim() };
    entries = [entry, ...entries];
    localStorage.setItem('sc_focus_log_v2', JSON.stringify(entries));
    newNote = '';
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
</script>

<svelte:head><title>Log — Session Clock</title></svelte:head>

<div class="log-page">
  <header class="log-header">
    <h1 class="log-title">Focus Log</h1>
    <span class="log-count">{entries.length} session{entries.length !== 1 ? 's' : ''}</span>
  </header>
  <div class="log-add">
    <input class="log-input" bind:value={newNote} maxlength={500} placeholder="Add session note…" on:keydown={e => e.key === 'Enter' && addEntry()} />
    <button class="log-add-btn" on:click={addEntry}>Add</button>
  </div>
  <div class="log-list">
    {#each entries as e}
      <div class="log-entry">
        <div class="log-entry-meta">
          <span class="log-entry-date">{fmtDate(e.date)}</span>
          <span class="log-entry-duration">{e.duration}m</span>
        </div>
        <p class="log-entry-note">{e.note}</p>
      </div>
    {:else}
      <p class="log-empty">No sessions logged yet.<br>Complete a Pomodoro or add a note above.</p>
    {/each}
  </div>
</div>

<style>
  .log-page { flex: 1; display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
  .log-header { display: flex; align-items: baseline; gap: 10px; padding: 18px 20px 12px; border-bottom: 1px solid rgba(255,255,255,.06); flex-shrink: 0; }
  .log-title { font-size: .9rem; font-weight: 800; }
  .log-count { font-size: .6rem; opacity: .38; }
  .log-add { display: flex; gap: 8px; padding: 12px 16px; flex-shrink: 0; }
  .log-input { flex: 1; padding: 9px 12px; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1); border-radius: 9px; color: inherit; font: inherit; font-size: .72rem; outline: none; }
  .log-input:focus { border-color: var(--accent, #6ee7b7); }
  .log-add-btn { padding: 9px 16px; background: var(--accent, #6ee7b7); border: none; border-radius: 9px; font-size: .72rem; font-weight: 700; color: #000; cursor: pointer; }
  .log-list { flex: 1; overflow-y: auto; padding: 0 16px 16px; display: flex; flex-direction: column; gap: 8px; padding-top: 4px; }
  .log-list::-webkit-scrollbar { width: 3px; }
  .log-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 99px; }
  .log-entry { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.06); border-radius: 10px; padding: 10px 14px; }
  .log-entry-meta { display: flex; justify-content: space-between; margin-bottom: 4px; }
  .log-entry-date { font-size: .58rem; opacity: .4; }
  .log-entry-duration { font-size: .58rem; opacity: .4; font-variant-numeric: tabular-nums; }
  .log-entry-note { font-size: .7rem; opacity: .8; line-height: 1.5; }
  .log-empty { font-size: .68rem; opacity: .32; padding: 24px 4px; line-height: 2; text-align: center; }
</style>
