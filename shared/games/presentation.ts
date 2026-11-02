export function dockingReadiness(state: { x: number; y: number; vx: number; vy: number; approach: number; mapIndex: number }) {
  const tolerance = 12 - state.mapIndex * 2
  return {
    tolerance,
    aligned: Math.abs(state.x) <= tolerance && Math.abs(state.y) <= tolerance,
    steady: Math.abs(state.vx) < 6 && Math.abs(state.vy) < 6,
    slow: state.approach <= .65,
    drift: Math.max(Math.abs(state.vx), Math.abs(state.vy)),
  }
}
export function finiteProgress(value: unknown, maximum = 1000000) {
  if ((typeof value !== 'number' && typeof value !== 'string') || !Number.isFinite(Number(value))) return 0
  return Math.max(0, Math.min(maximum, Math.floor(Number(value))))
}
