<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import type { PortalGame } from '../../data/games'
import GameDetails from './GameDetails.vue'

const props = defineProps<{ game: PortalGame | null }>()
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement>()
let previousFocus: HTMLElement | null = null
let previousOverflow = ''

function restore() {
  document.body.style.overflow = previousOverflow
  previousFocus?.focus()
}
watch(() => props.game, (game) => {
  if (game && dialog.value && !dialog.value.open) {
    previousFocus = document.activeElement as HTMLElement
    previousOverflow = document.body.style.overflow
    dialog.value.showModal()
    document.body.style.overflow = 'hidden'
  } else if (!game && dialog.value?.open) {
    dialog.value.close()
    restore()
  }
}, { flush: 'post' })
onBeforeUnmount(() => { if (dialog.value?.open) restore() })
</script>

<template>
  <dialog ref="dialog" aria-labelledby="game-dialog-title" @cancel.prevent="emit('close')" @close="emit('close')" @click="(event) => { if (event.target === dialog) emit('close') }">
    <article v-if="game" class="stack-lg">
      <button autofocus type="button" class="btn btn-secondary close" @click="emit('close')">Cerrar ×</button>
      <img :src="game.image" :alt="game.imageAlt" width="800" height="450">
      <div class="row"><span class="badge">{{ game.category }}</span><span class="badge badge-warning">{{ game.status === 'available' ? 'Disponible' : 'Próximamente' }}</span></div>
      <h2 id="game-dialog-title">{{ game.title }}</h2>
      <GameDetails :game="game" />



      <NuxtLink v-if="game.status === 'available'" :to="game.route" class="btn btn-primary" @click="emit('close')">Jugar</NuxtLink>
      <template v-else>
        <button type="button" class="btn btn-primary" disabled>Jugar · Próximamente</button>
        <NuxtLink v-if="game.previewRoute" :to="game.previewRoute" class="btn btn-secondary" @click="emit('close')">Ver preparación de la misión →</NuxtLink>
      </template>
    </article>
  </dialog>
</template>

<style scoped>
dialog { width: min(820px, calc(100% - 32px)); max-height: calc(100dvh - 32px); padding: 24px; border: 1px solid var(--border); border-radius: var(--radius-xl); background: var(--surface); color: var(--text); font-family: inherit; box-shadow: var(--shadow-card); }
dialog::backdrop { background: rgba(4, 8, 18, .85); }
img { width: 100%; height: auto; border-radius: var(--radius-md); }
.close { align-self: flex-end; position: sticky; top: 0; z-index: 1; }
h2 { font-size: 2rem; }
</style>
