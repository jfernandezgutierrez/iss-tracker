<script setup lang="ts">
import { games } from '../../data/games'
import GameDetails from '../../components/games/GameDetails.vue'
import GameShop from '../../components/games/GameShop.vue'
import GameLeaderboard from '../../components/games/GameLeaderboard.vue'
import PlayerSummary from '../../components/games/PlayerSummary.vue'
import GameAdSlot from '../../components/games/GameAdSlot.vue'
definePageMeta({ layout: 'games' })
const game = games.find(game => game.slug === 'iss-runner')!
useHead({
  title: 'ISS Runner — Juego espacial de plataformas',
  meta: [
    { name: 'description', content: 'Juega gratis a ISS Runner: salta entre plataformas orbitales, esquiva peligros, recoge monedas y vigila tu oxígeno. Compatible con teclado y móvil.' },
    { property: 'og:title', content: 'ISS Runner · ISS Tracker' },
    { property: 'og:description', content: game.description },
    { property: 'og:url', content: 'https://isstrackerlive.es/juegos/iss-runner' },
    { name: 'twitter:title', content: 'ISS Runner · ISS Tracker' },
    { name: 'twitter:description', content: game.description },
  ],
  link: [{ rel: 'canonical', href: 'https://isstrackerlive.es/juegos/iss-runner' }],
})
</script>
<template>
  <main class="container mission-page stack-lg">
    <NuxtLink to="/juegos">← Volver al catálogo de juegos</NuxtLink>
    <section class="stack" aria-labelledby="mission-title"><div class="row"><span class="badge">Plataformas</span><span class="badge badge-success">Disponible · Primera versión</span></div><h1 id="mission-title" class="display-title">ISS Runner</h1><p>{{ game.description }}</p></section>
    <PlayerSummary />
    <ClientOnly><GamesRunnerGame /><template #fallback><section class="panel-card"><p>El juego se carga en tu navegador. Puedes consultar las instrucciones a continuación.</p></section></template></ClientOnly>
    <GameAdSlot placement="game-info" />
    <section class="panel-card stack-lg" aria-labelledby="briefing-title"><h2 id="briefing-title" class="section-title">Antes de despegar</h2><GameDetails :game="game" /></section>
    <GameShop /><GameLeaderboard />
    <p class="text-soft">Gráficos pixel art originales de la primera versión. Puedes jugar como invitado; para guardar monedas y progresión inicia sesión antes de comenzar.</p>
  </main>
</template>
<style scoped>.mission-page { max-width: 1200px; padding-top: 32px; padding-bottom: 48px; }</style>
