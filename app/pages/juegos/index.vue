<script setup lang="ts">
import { ref } from 'vue'
import { games, type PortalGame } from '../../data/games'
import GameInfoDialog from '../../components/games/GameInfoDialog.vue'
import PlayerSummary from '../../components/games/PlayerSummary.vue'
import GameAdSlot from '../../components/games/GameAdSlot.vue'

definePageMeta({ layout: 'games' })
useHead({
  title: 'Juegos espaciales',
  meta: [
    { name: 'description', content: 'Juega gratis a ISS Runner y descubre los próximos juegos espaciales de ISS Tracker.' },
    { property: 'og:title', content: 'Juegos espaciales · ISS Tracker' },
    { property: 'og:description', content: 'Explora el futuro catálogo de aventuras espaciales de ISS Tracker.' },
    { property: 'og:url', content: 'https://isstrackerlive.es/juegos' },
  ],
  link: [{ rel: 'canonical', href: 'https://isstrackerlive.es/juegos' }],
})
const selectedGame = ref<PortalGame | null>(null)
</script>

<template>
  <main class="container games-page stack-lg">
    <section class="intro stack">
      <p class="eyebrow">Una nueva misión te espera</p>
      <h1 class="display-title">Juegos espaciales</h1>
      <p class="section-subtitle">Explora, supera desafíos y descubre otra forma de vivir el espacio. ISS Runner ya está disponible. Nuevas misiones llegarán próximamente.</p>
    </section>
    <PlayerSummary />
    <section aria-labelledby="catalog-title" class="stack-lg">
      <div><h2 id="catalog-title" class="section-title">Elige tu próxima aventura</h2><p class="section-subtitle">Empieza con ISS Runner o descubre los conceptos de nuestras próximas misiones.</p></div>
      <div class="game-grid">
        <article v-for="game in games" :key="game.slug" class="game-card" :class="{ featured: game.featured }">
          <img :src="game.image" :alt="game.imageAlt" width="800" height="450">
          <div class="game-content stack">
            <div class="row"><span class="badge">{{ game.category }}</span><span class="badge" :class="game.status === 'available' ? 'badge-success' : 'badge-warning'">{{ game.status === 'available' ? 'Disponible' : 'Próximamente' }}</span></div>
            <p v-if="game.featured" class="featured-label">Nuestra primera misión</p>
            <h3>{{ game.title }}</h3>
            <p class="text-soft description">{{ game.description }}</p>
            <button type="button" class="btn btn-secondary btn-block" :aria-label="`Consultar ${game.title}`" @click="selectedGame = game">Descubrir el juego →</button>
          </div>
        </article>
      </div>
    </section>
    <p class="text-soft concept-note">Portadas conceptuales. Meteor Dodge e ISS Docking estarán disponibles más adelante.</p>
    <GameAdSlot placement="catalog" /><GameInfoDialog :game="selectedGame" @close="selectedGame = null" />
  </main>
</template>

<style scoped>
.games-page { padding-top: 56px; padding-bottom: 48px; gap: 36px; }
.intro { max-width: 780px; }
.intro .eyebrow { margin: 0; }
.player-area { gap: 16px; }
.player-intro { flex: 1 1 300px; }
.player-intro p { margin-top: 8px; font-size: .9rem; }
.game-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
.game-card { overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-xl); background: var(--surface); box-shadow: var(--shadow-card); display: flex; flex-direction: column; }
.game-card.featured { border-color: var(--primary); }
.game-card img { width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: cover; }
.game-content { padding: 24px; flex: 1; }
.game-content h3 { font-size: 1.5rem; }
.description { flex: 1; }
.featured-label { color: var(--accent); font-weight: 700; font-size: .8rem; }
.concept-note { font-size: .85rem; }
@media (max-width: 1000px) { .game-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 620px) { .game-grid { grid-template-columns: 1fr; } .games-page { padding-top: 32px; } }
</style>
