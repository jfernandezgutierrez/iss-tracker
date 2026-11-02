import { shallowRef, ref, watch, onMounted } from 'vue'
import { decodePending, pendingKey, type PendingRun } from '#shared/games/pending'
import type { GameSlug } from '#shared/games/progression'

export function usePendingGameRun<T>(game: GameSlug) {
  const account = useGameAccount()
  const record = shallowRef<PendingRun<T> | null>(null)
  const warning = ref('')
  function restore() {
    record.value = null; warning.value = ''
    const uid = account.session.value?.user.id
    if (!uid || !import.meta.client) return
    try {
      const key = pendingKey(game, uid)
      const raw = localStorage.getItem(key)
      record.value = decodePending<T>(raw, game, uid)
      if (raw && !record.value) {
        localStorage.removeItem(key)
        warning.value = 'El resultado pendiente ha caducado o no se puede recuperar. Puedes comenzar otra partida.'
      }
    } catch { warning.value = 'El navegador no permite recuperar resultados en este dispositivo.' }
  }
  function queue(value: PendingRun<T>) {
    warning.value = ''
    try { localStorage.setItem(pendingKey(game, value.userId), JSON.stringify(value)) }
    catch { warning.value = 'No se pudo crear una copia local. Mantén esta pantalla abierta hasta guardar el resultado.' }
    if (value.userId === account.session.value?.user.id) record.value = value
    else warning.value = 'Vuelve a la cuenta que comenzó la partida para recuperar su resultado.'
  }
  function complete(value: PendingRun<T>) {
    warning.value = ''
    try {
      const key = pendingKey(game, value.userId)
      const stored = JSON.parse(localStorage.getItem(key) || 'null')
      if (stored?.runId === value.runId) localStorage.removeItem(key)
    } catch { warning.value = 'No se pudo eliminar la copia local. Puedes descartar el aviso al volver.' }
    if (record.value?.runId === value.runId && record.value.userId === value.userId) record.value = null
  }
  function discard() { if (record.value) complete(record.value) }
  watch(() => account.session.value?.user.id, restore)
  onMounted(restore)
  return { record, warning, queue, complete, discard }
}
