<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, reactive } from 'vue'
import GameAdSlot from './GameAdSlot.vue'
import type { RunnerController } from '../../games/runner/createGame'
import type { InputEvent, InputFrame } from '#shared/games/runner'
const account = useGameAccount()
const shell = ref<HTMLElement>()
const canvasHost = ref<HTMLElement>()
const phase = ref<'ready' | 'loading' | 'playing' | 'paused' | 'over'>('ready')
const stats = reactive({ oxygen: 55, maxOxygen: 55, health: 3, coins: 0, distance: 0, score: 0 })
const muted = ref(true)
const reason = ref('')
const errorMessage = ref('')
const saveMessage = ref('')
const saving = ref(false)
const record = ref<{ runId: string; events: InputEvent[]; ticks: number; userId: string } | null>(null)
const input: InputFrame = { direction: 0, jump: false }
let controller: RunnerController | undefined
let disposed = false
let generation = 0
let runId = ''
let runUser = ''
const held = new Set<string>()
const touches = new Set<string>()
function updateInput() {
  input.direction = ((held.has('ArrowRight') || held.has('KeyD') || touches.has('right') ? 1 : 0) - (held.has('ArrowLeft') || held.has('KeyA') || touches.has('left') ? 1 : 0)) as -1 | 0 | 1
  input.jump = held.has('Space') || held.has('ArrowUp') || held.has('KeyW') || touches.has('jump')
}
function resetInput() { held.clear(); touches.clear(); input.direction = 0; input.jump = false }
function pause() {
  if (phase.value !== 'playing') return
  resetInput(); phase.value = 'paused'; controller?.pause(true)
}
function resume() { if (document.hidden) return; phase.value = 'playing'; controller?.pause(false); shell.value?.focus() }
function keyDown(event: KeyboardEvent) {
  if (!shell.value?.contains(document.activeElement)) return
  if (event.code === 'Escape' && ['playing', 'paused'].includes(phase.value)) { event.preventDefault(); phase.value === 'playing' ? pause() : resume(); return }
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space', 'KeyA', 'KeyD', 'KeyW'].includes(event.code) || phase.value !== 'playing') return
  if ((event.target as HTMLElement).tagName === 'BUTTON' && event.code === 'Space') return
  event.preventDefault(); held.add(event.code); updateInput()
}
function keyUp(event: KeyboardEvent) { held.delete(event.code); updateInput() }
function touch(event: PointerEvent, action: string, pressed: boolean) {
  if (pressed) { (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId); touches.add(action) }
  else touches.delete(action)
  updateInput()
}
function visibility() { if (document.hidden) pause() }
async function start(guest = false) {
  if (phase.value === 'loading') return
  const attempt = ++generation
  phase.value = 'loading'; errorMessage.value = ''; saveMessage.value = ''; record.value = null
  controller?.destroy(); controller = undefined; resetInput()
  try {
    await account.init()
    let seed = crypto.getRandomValues(new Uint32Array(1))[0]! & 0x7fffffff
    let loadout = {}
    runId = ''; runUser = ''
    if (account.session.value && !guest) {
      const { data, error } = await account.getClient()!.rpc('start_game_run')
      if (error) throw new Error(error.message)
      seed = data.seed; loadout = data.loadout; runId = data.id; runUser = account.session.value.user.id
    }
    const [P, engine] = await Promise.all([import('phaser'), import('../../games/runner/createGame')])
    if (disposed || attempt !== generation || !canvasHost.value) return
    controller = engine.mountRunner(P.default, canvasHost.value, {
      seed, loadout, input, muted: muted.value,
      onReady() { phase.value = 'playing'; shell.value?.focus() },
      onStats(state) { stats.oxygen = state.oxygen; stats.maxOxygen = state.maxOxygen; stats.health = state.health; stats.coins = state.coins; stats.distance = Math.floor(Math.max(0, state.maxX - 90) / 10); stats.score = stats.distance + state.coins * 10 },
      onEnd(result, events, message) {
        phase.value = 'over'; reason.value = message; resetInput()
        if (runId) { record.value = { runId, events, ticks: result.ticks, userId: runUser }; save() }
        else saveMessage.value = 'Partida de invitado: resultado local, sin guardado en la nube.'
      },
    })
  } catch (error) { phase.value = 'ready'; errorMessage.value = error instanceof Error ? error.message : 'No se pudo cargar el juego.' }
}
async function save() {
  if (!record.value || saving.value) return
  saving.value = true; saveMessage.value = 'Validando la misión…'
  try {
    if (record.value.userId !== account.session.value?.user.id) throw new Error('Vuelve a iniciar sesión con la cuenta que empezó la partida.')
    const result = await $fetch<{ coins: number }>('/api/games/finish', { method: 'POST', headers: { Authorization: `Bearer ${await account.accessToken()}` }, body: { runId: record.value.runId, ticks: record.value.ticks, events: record.value.events } })
    saveMessage.value = `Misión verificada. ${result.coins} monedas guardadas.`; record.value = null; await account.refresh()
  } catch (error: any) { saveMessage.value = error.data?.statusMessage || error.message || 'No se pudo guardar. Puedes reintentar.' }
  finally { saving.value = false }
}
function toggleAudio() { muted.value = !muted.value; controller?.muted(muted.value); try { localStorage.setItem('iss-runner-muted', String(muted.value)) } catch {} }
onMounted(() => {
  try { muted.value = localStorage.getItem('iss-runner-muted') !== 'false' } catch {}
  window.addEventListener('keydown', keyDown); window.addEventListener('keyup', keyUp); window.addEventListener('blur', pause); document.addEventListener('visibilitychange', visibility)
})
onBeforeUnmount(() => { disposed = true; generation++; controller?.destroy(); resetInput(); window.removeEventListener('keydown', keyDown); window.removeEventListener('keyup', keyUp); window.removeEventListener('blur', pause); document.removeEventListener('visibilitychange', visibility) })
</script>
<template>
  <section ref="shell" class="runner-shell stack" tabindex="0" aria-label="ISS Runner. Flechas o A y D para moverte, espacio para saltar, Escape para pausar." @focusout="(event) => { if (!shell?.contains(event.relatedTarget as Node)) pause() }">
    <div class="row hud" aria-label="Estado de la misión">
      <label class="oxygen">Oxígeno {{ Math.ceil(stats.oxygen) }} s <meter :value="stats.oxygen" min="0" :max="stats.maxOxygen">{{ Math.ceil(stats.oxygen) }}</meter></label>
      <span>Traje: {{ stats.health }} / 3</span><span>{{ stats.distance }} m</span><span>{{ stats.coins }} monedas</span><span>{{ stats.score }} puntos</span>
      <button type="button" class="btn btn-ghost" :aria-pressed="!muted" @click="toggleAudio">{{ muted ? 'Activar sonido' : 'Silenciar' }}</button>
      <button v-if="phase === 'playing'" type="button" class="btn btn-secondary" @click="pause">Pausar</button>
    </div>
    <div class="game-viewport">
      <div ref="canvasHost" class="canvas-host" :aria-hidden="phase !== 'playing'" />
      <div v-if="phase !== 'playing'" class="game-overlay stack" aria-live="polite">
        <h2>{{ phase === 'over' ? 'Fin de la misión' : phase === 'paused' ? 'Misión en pausa' : phase === 'loading' ? 'Preparando el despegue…' : 'ISS Runner' }}</h2>
        <p v-if="phase === 'ready'">Explora a tu ritmo. Salta los huecos, recoge monedas y vigila el oxígeno.</p>
        <p v-if="phase === 'over'">{{ reason }} · {{ stats.score }} puntos</p>
        <button v-if="phase === 'ready' || phase === 'over'" type="button" class="btn btn-primary" @click="start()">{{ phase === 'over' ? 'Volver a jugar' : 'Comenzar partida' }}</button>
        <button v-if="phase === 'paused'" type="button" class="btn btn-primary" @click="resume">Reanudar</button>
        <button v-if="phase === 'ready' && account.session.value" type="button" class="btn btn-secondary" @click="start(true)">Jugar como invitado</button>
      </div>
    </div>
    <div class="row touch-controls" aria-label="Controles táctiles">
      <button v-for="control in [{ action: 'left', label: '← Izquierda' }, { action: 'right', label: 'Derecha →' }, { action: 'jump', label: 'Saltar ↑' }]" :key="control.action" type="button" class="btn btn-secondary" :disabled="phase !== 'playing'" @pointerdown.prevent="touch($event, control.action, true)" @pointerup="touch($event, control.action, false)" @pointercancel="touch($event, control.action, false)" @lostpointercapture="touch($event, control.action, false)" @keydown.enter.prevent="touches.add(control.action); updateInput()" @keyup.enter="touches.delete(control.action); updateInput()">{{ control.label }}</button>
    </div>
    <p class="text-soft">PC: ← → o A / D para moverte · Espacio / ↑ para saltar · Escape para pausar. En móvil usa los botones. Al cambiar de pestaña se pausa automáticamente.</p>
    <GameAdSlot v-if="phase === 'over'" placement="results" /><p v-if="errorMessage" role="alert" class="soft-error">{{ errorMessage }}</p>
    <p v-if="saveMessage" role="status">{{ saveMessage }}</p>
    <button v-if="record && phase === 'over'" type="button" class="btn btn-secondary" :disabled="saving" @click="save">Reintentar guardado</button>
    <p v-if="record && phase === 'over'" class="text-soft">Reintenta guardar antes de empezar otra partida para conservar este resultado.</p>
  </section>
</template>
<style scoped>
.runner-shell { padding: 16px; border: 1px solid var(--border); border-radius: var(--radius-xl); background: var(--surface); }
.hud { justify-content: space-between; font-size: .85rem; }.oxygen { margin: 0; }meter { display: block; width: 150px; height: 14px; }
.game-viewport { position: relative; width: 100%; aspect-ratio: 16/9; background: #0b1220; border-radius: var(--radius-md); overflow: hidden; }.canvas-host { position: absolute; inset: 0; }.canvas-host :deep(canvas) { display: block; }
.game-overlay { position: absolute; inset: 0; padding: 20px; background: rgba(7, 11, 20, .88); align-items: center; justify-content: center; text-align: center; overflow: auto; }.game-overlay h2 { font-size: clamp(1.2rem, 4vw, 2.4rem); }
.touch-controls { justify-content: space-between; }.touch-controls button { min-height: 52px; flex: 1; touch-action: none; user-select: none; }
@media (max-width: 540px) { .runner-shell { padding: 8px; }.game-viewport { min-height: 240px; }.touch-controls { gap: 6px; }.touch-controls button { padding: 10px 6px; }.game-overlay { gap: 10px; padding: 12px; }.game-overlay p { font-size: .8rem; } }
</style>
