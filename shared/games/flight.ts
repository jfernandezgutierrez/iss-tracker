import { FPS, MAX_TICKS, normalizedLoadout, type Loadout } from './config'
import type { InputEvent } from './runner'
export const FLIGHT_VERSION = 'runner-flight-v2'
export const FLIGHT = { height: 640, floor: 602, ceiling: 42, chunk: 700, speed: 235, gravity: 680, thrust: 1280 }
export interface FlightGate { x: number; center: number; gap: number; type: number }
export interface FlightCoin { id: string; x: number; y: number; oxygen: boolean }
export interface FlightChunk { index: number; gate: FlightGate; items: FlightCoin[] }
export interface FlightState {
  seed: number; tick: number; x: number; y: number; vy: number; maxX: number; coins: number; health: number
  oxygen: number; maxOxygen: number; shield: boolean; rescue: boolean; invulnerableUntil: number
  dead: boolean; reason: string; loadout: Loadout; chunks: FlightChunk[]; collected: Set<string>; boosting: boolean
}
function noise(seed: number, index: number) {
  let value = Math.imul(seed ^ (index + 71), 0x45d9f3b)
  value = Math.imul(value ^ value >>> 16, 0x45d9f3b)
  return ((value ^ value >>> 16) >>> 0) / 4294967296
}
export function flightChunk(seed: number, index: number): FlightChunk {
  const difficulty = Math.min(1, index / 100)
  const gate = { x: index * FLIGHT.chunk + 950, center: 240 + noise(seed, index) * 170, gap: 300 - difficulty * 80, type: index % 3 }
  const items = Array.from({ length: 8 }, (_, item) => ({ id: `${index}:coin:${item}`, x: index * FLIGHT.chunk + 240 + item * 55, y: 280 + Math.sin(item / 7 * Math.PI) * -100, oxygen: false }))
  if (index % 3 === 1) items.push({ id: `${index}:oxygen`, x: index * FLIGHT.chunk + 690, y: 300, oxygen: true })
  return { index, gate, items }
}
export function createFlight(seed: number, upgrades: Loadout = {}): FlightState {
  const loadout = normalizedLoadout(upgrades)
  const maxOxygen = 55 + (loadout.oxygen || 0) * 20
  return { seed, tick: 0, x: 90, maxX: 90, y: 350, vy: 0, coins: 0, health: 3, oxygen: maxOxygen, maxOxygen, shield: !!loadout.shield, rescue: !!loadout.thruster, invulnerableUntil: 0, dead: false, reason: '', loadout, chunks: [0,1,2,3].map(index => flightChunk(seed,index)), collected: new Set(), boosting: false }
}
export function stepFlight(state: FlightState, boosting: boolean) {
  if (state.dead) return
  state.tick++; state.boosting = boosting
  const difficulty = Math.min(1, state.x / 70000)
  state.x += (FLIGHT.speed + difficulty * 65) / FPS
  state.maxX = state.x
  const lift = FLIGHT.thrust + (state.loadout['double-jump'] || 0) * 100
  state.vy = Math.max(-265, Math.min(330, state.vy + (FLIGHT.gravity - (boosting ? lift : 0)) / FPS))
  state.y = Math.max(FLIGHT.ceiling, Math.min(FLIGHT.floor, state.y + state.vy / FPS))
  if (state.y === FLIGHT.floor || state.y === FLIGHT.ceiling) state.vy = 0
  const index = Math.floor(state.x / FLIGHT.chunk)
  state.chunks = state.chunks.filter(chunk => chunk.index >= index - 2)
  for (let next = state.chunks.at(-1)!.index + 1; next <= index + 3; next++) state.chunks.push(flightChunk(state.seed, next))
  for (const id of state.collected) if (Number(id.split(':')[0]) < index - 2) state.collected.delete(id)
  for (const chunk of state.chunks) {
    const gate = chunk.gate
    if (state.tick >= state.invulnerableUntil && Math.abs(state.x - gate.x) < 37 && (state.y - 18 < gate.center - gate.gap / 2 || state.y + 18 > gate.center + gate.gap / 2)) {
      if (state.shield) state.shield = false
      else state.health--
      if (state.health <= 0 && state.rescue) { state.health = 1; state.rescue = false; state.y = gate.center; state.vy = 0 }
      state.invulnerableUntil = state.tick + 100
    }
    for (const item of chunk.items) {
      if (state.collected.has(item.id)) continue
      if (Math.hypot(state.x - item.x, state.y - item.y) < (state.loadout.magnet && !item.oxygen ? 95 : 31)) {
        state.collected.add(item.id)
        if (item.oxygen) state.oxygen = Math.min(state.maxOxygen, state.oxygen + 23)
        else state.coins += 1 + (state.loadout.multiplier || 0)
      }
    }
  }
  state.oxygen = Math.max(0, state.oxygen - (1 + difficulty * .5) / FPS)
  if (state.health <= 0) { state.dead = true; state.reason = 'El traje necesita reparaciones. ¡Vuelve al hangar!' }
  if (state.oxygen <= 0) { state.dead = true; state.reason = 'Se ha agotado el oxígeno de la misión.' }
  if (state.tick >= MAX_TICKS) { state.dead = true; state.reason = '¡Misión de diez minutos completada!' }
}
export function flightResult(state: FlightState) { const distance = Math.floor((state.x - 90) / 10); return { distance, coins: state.coins, score: distance + state.coins * 10, ticks: state.tick } }
export function replayFlight(seed: number, loadout: Loadout, events: InputEvent[], ticks: number) {
  if (!Number.isInteger(ticks) || ticks < 1 || ticks > MAX_TICKS || !Array.isArray(events) || events.length > MAX_TICKS) throw new Error('Registro de vuelo inválido.')
  let previous = -1
  for (const event of events) {
    if (!event || !Number.isInteger(event.tick) || event.tick <= previous || event.tick < 0 || event.tick >= ticks || event.direction !== 1 || typeof event.jump !== 'boolean') throw new Error('Controles de vuelo inválidos.')
    previous = event.tick
  }
  const state = createFlight(seed, loadout)
  let cursor = 0; let boosting = false
  while (!state.dead && state.tick < ticks) {
    if (events[cursor]?.tick === state.tick) boosting = events[cursor++]!.jump
    stepFlight(state, boosting)
  }
  if (!state.dead || state.tick !== ticks) throw new Error('El vuelo no ha terminado o contiene datos posteriores al final.')
  return flightResult(state)
}
