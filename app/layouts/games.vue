<script setup lang="ts">
import GamePrivacy from '../components/games/GamePrivacy.vue'
</script>
<template>
  <div class="games-layout">
    <header class="portal-header container">
      <NuxtLink class="portal-brand" to="/juegos">ISS Tracker <span class="badge">Games</span></NuxtLink>
      <NuxtLink class="btn btn-secondary" to="/">← Volver a ISS Tracker</NuxtLink>
    </header>
    <slot /><footer class="container portal-footer"><GamePrivacy /></footer>
  </div>
</template>

<style scoped>
.portal-footer { padding-bottom: 32px; }.games-layout { min-height: 100vh; background: radial-gradient(ellipse at top, var(--glow), transparent 55%), var(--bg); }
.portal-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-top: 20px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
.portal-brand { color: var(--text); font-weight: 700; display: flex; align-items: center; gap: 10px; }
.games-layout :deep(:focus-visible) { outline: 3px solid var(--accent); outline-offset: 4px; }
@media (max-width: 520px) { .portal-header { flex-direction: column; align-items: flex-start; } }
</style>
