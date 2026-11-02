import type { GameSlug } from './progression'

export interface PendingRun<T = unknown> {
  runId: string
  userId: string
  startedAt: number
  ticks: number
  events: T[]
}
export const PENDING_TTL = 2 * 60 * 60 * 1000
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function pendingKey(game: GameSlug, userId: string) { return `iss-pending-${game}-${userId}-v1` }

// A bounded local recovery copy only. The server still authenticates and replays every run.
export function decodePending<T>(raw: string | null, game: GameSlug, userId: string, now = Date.now()): PendingRun<T> | null {
  if (!raw || raw.length > 2500000) return null
  try {
    const run = JSON.parse(raw)
    const maxTicks = game === 'iss-runner' ? 36000 : 10800
    if (!run || !uuid.test(run.runId) || run.userId !== userId || !uuid.test(userId)
      || !Number.isFinite(run.startedAt) || run.startedAt > now || now - run.startedAt >= PENDING_TTL
      || !Number.isInteger(run.ticks) || run.ticks < 1 || run.ticks > maxTicks
      || !Array.isArray(run.events) || run.events.length > run.ticks) return null
    let previous = -1
    for (const event of run.events) {
      if (!event || !Number.isInteger(event.tick) || event.tick <= previous || event.tick < 0 || event.tick >= run.ticks) return null
      previous = event.tick
      if (game === 'iss-runner') {
        if (event.direction !== 1 || typeof event.jump !== 'boolean') return null
      } else if (![-1, 0, 1].includes(event.x) || ![-1, 0, 1].includes(event.y) || typeof event.boost !== 'boolean') return null
    }
    return { runId: run.runId, userId, startedAt: run.startedAt, ticks: run.ticks, events: run.events }
  } catch { return null }
}
