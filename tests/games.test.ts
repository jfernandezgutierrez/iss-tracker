import test from 'node:test'
import assert from 'node:assert/strict'
import { createRunner, stepRunner, runnerResult, replayRunner, segmentFor, platformY } from '../shared/games/runner'
import { WORLD, MAX_TICKS } from '../shared/games/config'
import { GameAds } from '../shared/games/ads'

test('recorded controls replay exactly and reject fabricated or incomplete runs', () => {
  const state = createRunner(12345)
  const events = [{ tick: 0, direction: 1 as const, jump: false }]
  while (!state.dead) stepRunner(state, events[0]!)
  assert.deepEqual(replayRunner(12345, {}, events, state.tick), runnerResult(state))
  assert.throws(() => replayRunner(12345, {}, events, state.tick + 1))
  assert.throws(() => replayRunner(12345, {}, events, 10))
  assert.throws(() => replayRunner(12345, {}, [{ tick: 0, direction: 2 as any, jump: false }], 100))
  assert.throws(() => replayRunner(12345, {}, [{ tick: 1, direction: 0, jump: false }, { tick: 1, direction: 1, jump: false }], 100))
  assert.throws(() => replayRunner(12345, {}, [], MAX_TICKS + 1))
})
test('free movement permits going left without farming distance points', () => {
  const state = createRunner(7)
  for (let i = 0; i < 40; i++) stepRunner(state, { direction: 1, jump: false })
  const before = runnerResult(state).distance
  const x = state.x
  for (let i = 0; i < 20; i++) stepRunner(state, { direction: -1, jump: false })
  assert.ok(state.x < x)
  assert.equal(runnerResult(state).distance, before)
})
test('base jump crosses every adjacent platform layout sampled across five biomes', () => {
  for (let seed = 1; seed <= 40; seed++) for (let index = 0; index < 160; index++) {
    const a = segmentFor(seed, index).platform
    const b = segmentFor(seed, index + 1).platform
    const gap = b.x - (a.x + a.width)
    // Worst vertical separation includes movement of both surfaces.
    const rise = a.y - b.y + (a.moving ? 10 : 0) + (b.moving ? 10 : 0)
    const time = (WORLD.jump + Math.sqrt(WORLD.jump ** 2 - 2 * WORLD.gravity * Math.max(0, rise))) / WORLD.gravity
    assert.ok(gap + 22 < WORLD.speed * time, `unreachable seed ${seed}, segment ${index}`)
  }
})
test('upgrades change only intended mechanics and normalize untrusted levels', () => {
  assert.equal(createRunner(1, { oxygen: 999 }).maxOxygen, 115)
  assert.equal(createRunner(1, { shield: 1 }).shield, true)
  assert.equal(createRunner(1, { thruster: 1 }).thruster, true)
  const base = createRunner(1)
  const upgraded = createRunner(1, { 'double-jump': 1 })
  for (let i = 0; i < 30; i++) { stepRunner(base, { direction: 0, jump: false }); stepRunner(upgraded, { direction: 0, jump: false }) }
  for (const state of [base, upgraded]) {
    stepRunner(state, { direction: 0, jump: true })
    for (let i = 0; i < 15; i++) stepRunner(state, { direction: 0, jump: false })
    stepRunner(state, { direction: 0, jump: true })
  }
  assert.ok(upgraded.vy < base.vy)
  const normal = createRunner(7); const multiplier = createRunner(7, { multiplier: 1 })
  for (let i = 0; i < 50; i++) { stepRunner(normal, { direction: 1, jump: false }); stepRunner(multiplier, { direction: 1, jump: false }) }
  assert.ok(normal.coins > 0); assert.equal(multiplier.coins, normal.coins * 2)
})
test('world and collection memory remain bounded during a ten minute exploration', () => {
  const state = createRunner(32, { oxygen: 3, shield: 1, 'double-jump': 1, magnet: 1 })
  let maximumSegments = 0
  for (let tick = 0; tick < MAX_TICKS; tick++) {
    // Stress the stream independently of survival so every segment is visited.
    state.health = 3; state.oxygen = state.maxOxygen
    const platform = state.segments.find(segment => state.x >= segment.platform.x && state.x < segment.platform.x + segment.platform.width)?.platform
    const jump = state.grounded && !!platform && platform.x + platform.width - state.x < 55
    stepRunner(state, { direction: 1, jump })
    if (state.dead && state.tick < MAX_TICKS) { state.dead = false; state.y = 300; state.vy = 0 }
    maximumSegments = Math.max(maximumSegments, state.segments.length)
    assert.ok(state.collected.size < 50)
  }
  assert.ok(state.maxX > 100000)
  assert.ok(maximumSegments <= 8)
})
test('ad adapter cannot load live ads, reward play or interrupt a mission', async () => {
  assert.equal((await new GameAds().request('catalog', true)).state, 'disabled')
  const ads = new GameAds(true)
  assert.equal((await ads.request('catalog', false)).state, 'needs-consent')
  assert.equal((await ads.request('catalog', true, true)).state, 'unavailable')
  assert.equal((await ads.request('rewarded', true)).rewardGranted, false)
  assert.equal((await ads.request('catalog', true)).state, 'test')
  assert.equal((await ads.request('results', true)).state, 'frequency-limited')
})
