import type Phaser from 'phaser'
import { createRunner, stepRunner, runnerResult, platformY, hazardX, type InputFrame, type InputEvent, type RunnerState } from '#shared/games/runner'
import { WORLD, FPS, type Loadout } from '#shared/games/config'
export interface RunnerController { destroy(): void; pause(value: boolean): void; muted(value: boolean): void }
export interface RunnerOptions {
  seed: number; loadout: Loadout; input: InputFrame; muted: boolean
  onReady(): void; onStats(state: RunnerState): void
  onEnd(result: ReturnType<typeof runnerResult>, events: InputEvent[], reason: string): void
}
export function mountRunner(P: typeof Phaser, parent: HTMLElement, options: RunnerOptions): RunnerController {
  let paused = false
  let muted = options.muted
  let audio: AudioContext | undefined
  let sceneReady = false
  const state = createRunner(options.seed, options.loadout)
  const events: InputEvent[] = []
  let lastInput: InputFrame = { direction: 0, jump: false }
  const animationFrames: Record<string, [number, number]> = { idle: [0,3], run: [4,11], jump: [12,13], fall: [14,15], hurt: [16,18], die: [19,24], celebrate: [25,28] }
  function sound(frequency: number) {
    if (muted) return
    try {
      audio ||= new AudioContext()
      const oscillator = audio.createOscillator(); const gain = audio.createGain()
      oscillator.type = 'square'; oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(.025, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .1)
      oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + .1)
    } catch { /* Audio is optional; unsupported devices remain silent. */ }
  }
  class RunnerScene extends P.Scene {
    astronaut!: Phaser.GameObjects.Sprite
    platforms!: Phaser.GameObjects.Graphics
    effects!: Phaser.GameObjects.Graphics
    itemPool: Phaser.GameObjects.Sprite[] = []
    hazardPool: Phaser.GameObjects.Sprite[] = []
    layers: Phaser.GameObjects.TileSprite[] = []
    accumulator = 0
    biome = -1
    particles: { x: number; y: number; life: number; color: number; vx: number; vy: number }[] = []
    constructor() { super('runner') }
    preload() {
      this.load.spritesheet('astronaut', '/games/runner/astronaut.png', { frameWidth: 32, frameHeight: 32 })
      this.load.spritesheet('hazards', '/games/runner/hazards.png', { frameWidth: 32, frameHeight: 32 })
      this.load.spritesheet('objects', '/games/runner/objects.png', { frameWidth: 16, frameHeight: 16 })
      for (let biome = 0; biome < 5; biome++) for (let layer = 0; layer < 3; layer++) this.load.image(`biome-${biome}-${layer}`, `/games/runner/biome-${biome}-${layer}.png`)
    }
    create() {
      for (let layer = 0; layer < 3; layer++) this.layers.push(this.add.tileSprite(0, 0, WORLD.width, WORLD.height, `biome-0-${layer}`).setOrigin(0).setScrollFactor(0).setDepth(-10 + layer))
      this.platforms = this.add.graphics()
      this.effects = this.add.graphics().setDepth(8)
      for (const [key, range] of Object.entries(animationFrames)) this.anims.create({ key, frames: this.anims.generateFrameNumbers('astronaut', { start: range[0], end: range[1] }), frameRate: key === 'run' ? 10 : 6, repeat: ['die', 'hurt'].includes(key) ? 0 : -1 })
      this.astronaut = this.add.sprite(state.x, state.y, 'astronaut').setDepth(5).setScale(1.5)
      for (let i = 0; i < 48; i++) this.itemPool.push(this.add.sprite(0, 0, 'objects').setVisible(false).setScale(1.5))
      for (let i = 0; i < 10; i++) this.hazardPool.push(this.add.sprite(0, 0, 'hazards').setVisible(false).setScale(1.3))
      this.cameras.main.setRoundPixels(true)
      sceneReady = true; options.onReady(); options.onStats(state)
      this.renderWorld()
    }
    burst(color: number) {
      for (let i = 0; i < 10 && this.particles.length < 64; i++) this.particles.push({ x: state.x, y: state.y, life: 24, color, vx: Math.cos(i * 2.4) * 2, vy: Math.sin(i * 2.4) * 2 })
    }
    renderWorld() {
      const cameraX = Math.max(0, state.maxX - 300)
      this.cameras.main.scrollX = cameraX
      const biome = Math.floor(state.maxX / (WORLD.segment * 20)) % 5
      this.layers.forEach((layer, index) => {
        if (biome !== this.biome) layer.setTexture(`biome-${biome}-${index}`)
        layer.tilePositionX = cameraX * (.08 + index * .12)
      })
      this.biome = biome
      this.platforms.clear(); this.effects.clear()
      let itemIndex = 0; let hazardIndex = 0
      for (const segment of state.segments) {
        const platform = segment.platform; const y = platformY(platform, state.tick)
        this.platforms.fillStyle(biome === 3 ? 0x70404a : 0x182f49).fillRect(platform.x, y, platform.width, 40)
        this.platforms.fillStyle(platform.moving ? 0xffc857 : 0x6ef2d8).fillRect(platform.x, y, platform.width, 4)
        this.platforms.lineStyle(1, 0x4da3ff, .4).strokeRect(platform.x, y, platform.width, 40)
        for (const item of segment.items) {
          if (state.collected.has(item.id) || itemIndex >= this.itemPool.length) continue
          this.itemPool[itemIndex++]!.setPosition(item.x, item.y).setFrame(item.type === 'coin' ? 0 : 1).setVisible(true)
        }
        for (const hazard of segment.hazards) {
          if (hazardIndex >= this.hazardPool.length) break
          this.hazardPool[hazardIndex++]!.setPosition(hazardX(hazard, state.tick, segment.index), hazard.y).setFrame(hazard.type * 4 + Math.floor(state.tick / 8) % 4).setVisible(true)
        }
      }
      for (; itemIndex < this.itemPool.length; itemIndex++) this.itemPool[itemIndex]!.setVisible(false)
      for (; hazardIndex < this.hazardPool.length; hazardIndex++) this.hazardPool[hazardIndex]!.setVisible(false)
      this.astronaut.setPosition(state.x, state.y).setFlipX(state.vx < 0)
      const animation = state.dead ? state.reason.startsWith('Misión completada') ? 'celebrate' : 'die' : state.tick < state.invulnerableUntil ? 'hurt' : !state.grounded ? state.vy < 0 ? 'jump' : 'fall' : state.vx ? 'run' : 'idle'
      this.astronaut.play(animation, true).setAlpha(state.tick < state.invulnerableUntil && state.tick % 10 < 5 ? .4 : 1)
      if (state.shield) this.effects.lineStyle(2, 0x4da3ff, .7).strokeCircle(state.x, state.y, 27)
      if (!state.grounded && state.vy < 0) this.effects.fillStyle(0x6ef2d8, .8).fillRect(state.x - 2, state.y + 24 + state.tick % 4, 4, 5)
      if (state.collected.size && state.tick % 12 < 4) this.effects.fillStyle(0xffc857, .65).fillRect(state.x - 16, state.y - 25, 3, 3)
      this.particles = this.particles.filter(particle => particle.life > 0)
      for (const particle of this.particles) {
        particle.x += particle.vx; particle.y += particle.vy; particle.life--
        this.effects.fillStyle(particle.color, particle.life / 24).fillRect(particle.x, particle.y, 3, 3)
      }
      // A subtle edge marks the oldest traversable part of the world.
      this.platforms.lineStyle(2, 0x4da3ff, .25).lineBetween(Math.max(0, state.maxX - 1000), 0, Math.max(0, state.maxX - 1000), WORLD.height)
    }
    override update(_time: number, delta: number) {
      if (!sceneReady || paused || state.dead) return
      this.accumulator += Math.min(delta, 100)
      while (this.accumulator >= 1000 / FPS && !state.dead) {
        this.accumulator -= 1000 / FPS
        const input = { direction: options.input.direction, jump: options.input.jump }
        if (input.direction !== lastInput.direction || input.jump !== lastInput.jump) { events.push({ tick: state.tick, ...input }); lastInput = input }
        const oldCoins = state.coins; const oldHealth = state.health
        stepRunner(state, input)
        if (state.coins > oldCoins) { sound(740); this.burst(0xffc857) }
        if (state.health < oldHealth) { sound(130); this.burst(0xff6b6b) }
        if (state.tick % 6 === 0) options.onStats(state)
      }
      if (state.dead) this.burst(0xff8b62)
      this.renderWorld()
      if (state.dead) { options.onStats(state); options.onEnd(runnerResult(state), events, state.reason) }
    }
  }
  const game = new P.Game({ type: P.AUTO, parent, width: WORLD.width, height: WORLD.height, backgroundColor: '#0b1220', pixelArt: true, antialias: false, input: { keyboard: false }, scale: { mode: P.Scale.FIT, autoCenter: P.Scale.CENTER_BOTH }, scene: RunnerScene, audio: { noAudio: true } })
  return {
    pause(value) { paused = value; if (value) { options.input.direction = 0; options.input.jump = false; audio?.suspend().catch(() => {}) } else audio?.resume().catch(() => {}) },
    muted(value) { muted = value },
    destroy() { sceneReady = false; game.destroy(true); audio?.close().catch(() => {}) },
  }
}
