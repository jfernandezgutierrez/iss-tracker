<script setup lang="ts">
import type { PortalGame } from '../../data/games'
defineProps<{ game: PortalGame }>()
</script>

<template>
  <div class="game-details stack-lg">
    <p>{{ game.fullDescription }}</p>
    <p v-if="game.status !== 'available'" class="notice">Diseño previsto · El juego todavía no está disponible. Controles, mecánicas y puntuación pueden cambiar durante su desarrollo.</p>
    <section class="stack"><h3>Objetivo</h3><p>{{ game.objective }}</p></section>
    <div class="controls-grid">
      <section><h3>Controles para PC</h3><ul><li v-for="control in game.pcControls" :key="control">{{ control }}</li></ul></section>
      <section><h3>Controles para móvil</h3><ul><li v-for="control in game.mobileControls" :key="control">{{ control }}</li></ul></section>
    </div>
    <section><h3>Mecánicas principales</h3><ul><li v-for="mechanic in game.mechanics" :key="mechanic">{{ mechanic }}</li></ul></section>
    <section><h3>Reglas de puntuación</h3><ul><li v-for="rule in game.scoring" :key="rule">{{ rule }}</li></ul></section>
  </div>
</template>

<style scoped>
.controls-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
.notice { padding: 16px; border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--warning); background: var(--surface-2); }
li { margin-top: 8px; color: var(--text-soft); }
ul { margin: 12px 0 0; padding-left: 20px; }
@media (max-width: 600px) { .controls-grid { grid-template-columns: 1fr; } }
</style>
