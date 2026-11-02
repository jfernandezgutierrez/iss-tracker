<script setup lang="ts">
import { games } from '../../data/games'
definePageMeta({layout:'games'})
const game=games.find(game=>game.slug==='iss-runner')!
useHead({title:'ISS Runner — Orbital Rush',meta:[
 {name:'description',content:'Vuela con un solo dedo en ISS Runner: mantén pulsado para activar el propulsor, esquiva rayos y completa misiones. Tienda y récords dentro del juego.'},
 {property:'og:title',content:'ISS Runner · Orbital Rush'},
 {property:'og:description',content:game.description},
 {property:'og:url',content:'https://isstrackerlive.es/juegos/iss-runner'},
],link:[{rel:'canonical',href:'https://isstrackerlive.es/juegos/iss-runner'}]})
</script>
<template>
 <main class="flight-page">
  <h1 class="sr-only">ISS Runner · Orbital Rush</h1>
  <ClientOnly><GamesRunnerGame/><template #fallback><section class="flight-fallback"><h2>Preparando el hangar</h2><p>Vuela con un solo dedo: mantén pulsado para subir, suelta para bajar y esquiva los emisores de energía. Recoge monedas y completa misiones.</p><NuxtLink to="/juegos">Volver al catálogo</NuxtLink></section></template></ClientOnly>
 </main>
</template>
<style scoped>
.flight-page{width:100%;max-width:1180px;height:100dvh;min-height:420px;margin:0 auto;padding:16px}.flight-fallback{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:32px;text-align:center;background:#0c1d2e;border-radius:24px}.flight-fallback p{max-width:480px;color:var(--text-soft)}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@media(max-width:600px){.flight-page{padding:0;min-height:0}.flight-page :deep(.runner-shell){border:0;border-radius:0;min-height:0}}
@media(max-height:600px)and(min-width:600px){.flight-page{padding:0;min-height:0}.flight-page :deep(.runner-shell){border-radius:0}}
</style>
