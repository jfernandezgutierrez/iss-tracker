import { FPS, MAX_TICKS, WORLD, normalizedLoadout, type Loadout } from './config'
export interface InputFrame { direction: -1 | 0 | 1; jump: boolean }
export interface InputEvent extends InputFrame { tick: number }
export interface Platform { x: number; y: number; width: number; moving: boolean; index: number }
export interface Item { id: string; x: number; y: number; type: 'coin' | 'oxygen' }
export interface Hazard { id: string; x: number; y: number; type: number }
export interface Segment { index: number; platform: Platform; items: Item[]; hazards: Hazard[] }
export interface RunnerState {
  seed: number; tick: number; x: number; y: number; vx: number; vy: number; maxX: number
  coins: number; oxygen: number; maxOxygen: number; health: number; grounded: boolean; jumps: number
  previousJump: boolean; shield: boolean; thruster: boolean; invulnerableUntil: number
  dead: boolean; reason: string; loadout: Loadout; segments: Segment[]; collected: Set<string>
}
function random(seed: number, index: number, salt: number) {
  let n = (seed ^ Math.imul(index + 1, 374761393) ^ Math.imul(salt + 1, 668265263)) >>> 0
  n = Math.imul(n ^ (n >>> 13), 1274126177)
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296
}
export function segmentFor(seed: number, index: number): Segment {
  const difficulty = Math.min(1, index / 100)
  const gap = index === 0 ? 0 : 34 + Math.floor(random(seed, index, 0) * (32 + difficulty * 26))
  const x = index * WORLD.segment + gap
  const y = 410 + Math.floor(random(seed, index, 1) * 28)
  const width = WORLD.segment - gap
  const items: Item[] = Array.from({ length: 4 }, (_, i) => ({ id: `${index}:coin:${i}`, x: x + 64 + i * 58, y: y - 43, type: 'coin' }))
  if (index % (difficulty > .7 ? 4 : 3) === 1) items.push({ id: `${index}:oxygen`, x: x + width - 42, y: y - 45, type: 'oxygen' })
  const hazards: Hazard[] = index < 2 ? [] : [{ id: `${index}:hazard`, x: x + width * .6, y: y - 19, type: index % 6 }]
  return { index, platform: { x, y, width, moving: index > 8 && index % 9 === 0, index }, items, hazards }
}
export function platformY(platform: Platform, tick: number) { return platform.y + (platform.moving ? Math.sin(tick / 90 + platform.index) * 10 : 0) }
export function hazardX(hazard: Hazard, tick: number, index: number) { return hazard.x + (hazard.type % 2 ? Math.sin(tick / Math.max(16, 50 - index * .2)) * 30 : 0) }
export function createRunner(seed: number, upgrades: Loadout = {}): RunnerState {
  const loadout = normalizedLoadout(upgrades)
  const maxOxygen = 55 + (loadout.oxygen || 0) * 20
  return { seed, tick: 0, x: 90, y: 350, vx: 0, vy: 0, maxX: 90, coins: 0, oxygen: maxOxygen, maxOxygen, health: 3, grounded: false, jumps: 0, previousJump: false, shield: !!loadout.shield, thruster: !!loadout.thruster, invulnerableUntil: 0, dead: false, reason: '', loadout, segments: Array.from({ length: 5 }, (_, index) => segmentFor(seed, index)), collected: new Set() }
}
export function stepRunner(state: RunnerState, input: InputFrame) {
  if (state.dead) return
  state.tick++
  const dt = 1 / FPS
  const leftBoundary = Math.max(14, state.maxX - 1000)
  const previousFeet = state.y + WORLD.playerHeight / 2
  state.vx = input.direction * WORLD.speed
  if (input.jump && !state.previousJump && (state.grounded || ((state.loadout['double-jump'] || 0) > 0 && state.jumps < 2))) {
    state.vy = -WORLD.jump; state.jumps++; state.grounded = false
  }
  state.previousJump = input.jump
  state.vy += WORLD.gravity * dt
  state.x = Math.max(leftBoundary, state.x + state.vx * dt)
  state.y += state.vy * dt
  state.maxX = Math.max(state.maxX, state.x)
  const current = Math.floor(state.maxX / WORLD.segment)
  state.segments = state.segments.filter(segment => segment.index >= Math.max(0, current - 3))
  for (let index = state.segments.at(-1)!.index + 1; index <= current + 4; index++) state.segments.push(segmentFor(state.seed, index))
  // IDs behind the one-way camera boundary can never be collected again.
  for (const id of state.collected) if (Number(id.split(':')[0]) < current - 3) state.collected.delete(id)
  state.grounded = false
  for (const segment of state.segments) {
    const platform = segment.platform
    const top = platformY(platform, state.tick)
    if (state.vy >= 0 && state.x + 10 > platform.x && state.x - 10 < platform.x + platform.width && previousFeet <= top + 3 && state.y + 15 >= top) {
      state.y = top - 15; state.vy = 0; state.grounded = true; state.jumps = 0
    }
    for (const item of segment.items) {
      if (state.collected.has(item.id)) continue
      const radius = item.type === 'coin' && state.loadout.magnet ? 90 : 27
      if (Math.hypot(state.x - item.x, state.y - item.y) < radius) {
        state.collected.add(item.id)
        if (item.type === 'coin') state.coins += 1 + (state.loadout.multiplier || 0)
        else state.oxygen = Math.min(state.maxOxygen, state.oxygen + 23)
      }
    }
    for (const hazard of segment.hazards) {
      if (state.tick < state.invulnerableUntil) continue
      if (Math.abs(state.x - hazardX(hazard, state.tick, segment.index)) < 26 && Math.abs(state.y - hazard.y) < 28) {
        if (state.shield) state.shield = false
        else state.health--
        state.invulnerableUntil = state.tick + 100
      }
    }
  }
  state.oxygen = Math.max(0, state.oxygen - dt * (1 + Math.min(.6, current / 120)))
  if (state.y > WORLD.height + 30 && state.thruster) {
    const landing = state.segments.find(segment => segment.platform.x + segment.platform.width > state.x)!
    state.x = landing.platform.x + 30; state.y = landing.platform.y - 100; state.vy = -200; state.thruster = false
  }
  if (state.y > WORLD.height + 100) { state.dead = true; state.reason = 'Has caído fuera de la estación.' }
  if (state.health <= 0) { state.dead = true; state.reason = 'El traje ha sufrido demasiado daño.' }
  if (state.oxygen <= 0) { state.dead = true; state.reason = 'Se ha agotado el oxígeno.' }
  if (state.tick >= MAX_TICKS) { state.dead = true; state.reason = 'Misión completada: límite de seguridad de diez minutos.' }
}
export function runnerResult(state: RunnerState) {
  const distance = Math.floor(Math.max(0, state.maxX - 90) / 10)
  return { distance, coins: state.coins, score: distance + state.coins * 10, ticks: state.tick }
}
export function replayRunner(seed: number, loadout: Loadout, events: InputEvent[], ticks: number) {
  if (!Number.isInteger(ticks) || ticks < 1 || ticks > MAX_TICKS || !Array.isArray(events) || events.length > MAX_TICKS) throw new Error('Registro de partida inválido.')
  let previousTick = -1
  for (const event of events) {
    if (!event || !Number.isInteger(event.tick) || event.tick <= previousTick || event.tick < 0 || event.tick >= ticks || ![-1, 0, 1].includes(event.direction) || typeof event.jump !== 'boolean') throw new Error('Secuencia de controles inválida.')
    previousTick = event.tick
  }
  const state = createRunner(seed, loadout)
  let cursor = 0
  let input: InputFrame = { direction: 0, jump: false }
  while (state.tick < ticks && !state.dead) {
    if (events[cursor]?.tick === state.tick) input = events[cursor++]!
    stepRunner(state, input)
  }
  if (!state.dead || state.tick !== ticks) throw new Error('La partida no ha terminado o contiene movimientos posteriores al final.')
  return runnerResult(state)
}
