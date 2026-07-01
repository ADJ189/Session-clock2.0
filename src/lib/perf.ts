export type QualityTier = 'low' | 'med' | 'high';
let tier: QualityTier = 'high';
let frameSkipCounter = 0;
let tabVisible = true;

export function initPerf(): QualityTier {
  const override = (typeof localStorage !== 'undefined') ? localStorage.getItem('sc_quality') as QualityTier | null : null;
  if (override === 'low' || override === 'med' || override === 'high') { tier = override; }
  else {
    const nav = navigator as any;
    const ram = nav.deviceMemory ?? 4;
    const cores = nav.hardwareConcurrency ?? 4;
    const conn = nav.connection?.effectiveType ?? '4g';
    const dpr = window.devicePixelRatio ?? 1;
    const touch = navigator.maxTouchPoints > 0;
    let score = 0;
    if (ram >= 8) score += 2; else if (ram >= 4) score += 1;
    if (cores >= 8) score += 2; else if (cores >= 4) score += 1;
    if (conn === '4g' || conn === 'wifi') score += 1;
    if (dpr <= 1.5) score += 1;
    if (touch) score -= 1;
    tier = score >= 5 ? 'high' : score >= 3 ? 'med' : 'low';
  }
  document.addEventListener('visibilitychange', () => { tabVisible = !document.hidden; });
  return tier;
}

export const getTier = () => tier;
export const setTier = (t: QualityTier) => { tier = t; localStorage.setItem('sc_quality', t); };
export const isTabVisible = () => tabVisible;
export function shouldRenderFull(): boolean {
  if (!tabVisible) return false;
  frameSkipCounter++;
  if (tier === 'high') return true;
  if (tier === 'med') return frameSkipCounter % 2 === 0;
  return frameSkipCounter % 3 === 0;
}
export const shouldDrawGlow = () => tier !== 'low';
export const maxParticles = (base: number) => tier === 'high' ? base : tier === 'med' ? Math.round(base * 0.55) : Math.round(base * 0.25);
export const particleStepSize = () => tier === 'low' ? 3 : tier === 'med' ? 2 : 1;
