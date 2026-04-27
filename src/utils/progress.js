export function clamp01(n) {
  return Math.min(1, Math.max(0, n))
}

// Blue (210deg) -> Red (0deg)
export function pctToColor(pct) {
  const p = clamp01(pct)
  const hue = 210 - 210 * p
  return `hsl(${hue} 90% 55%)`
}

