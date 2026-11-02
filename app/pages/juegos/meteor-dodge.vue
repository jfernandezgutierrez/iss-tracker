<script setup lang="ts">
import{games}from'../../data/games'
definePageMeta({layout:'games'})
const game=games.find(game=>game.slug==='meteor-dodge')!
useHead({title:game.title,meta:[{name:'description',content:game.description},{property:'og:title',content:game.title+' · ISS Tracker'},{property:'og:description',content:game.description},{property:'og:url',content:'https://isstrackerlive.es/juegos/meteor-dodge'}],link:[{rel:'canonical',href:'https://isstrackerlive.es/juegos/meteor-dodge'}]})
</script>
<template><main class="arcade-page"><h1 class="sr-only">{{game.title}}</h1><ClientOnly><GamesArcadeGame game="meteor-dodge"/><template #fallback><section class="fallback"><h2>{{game.title}}</h2><p>{{game.fullDescription}}</p><p>{{game.objective}}</p><NuxtLink to="/juegos">Volver al catálogo</NuxtLink></section></template></ClientOnly></main></template>
<style scoped>.arcade-page{height:100dvh;width:100%;max-width:1180px;margin:0 auto;padding:16px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}.fallback{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:32px;text-align:center;background:#0d2132;border-radius:25px}.fallback p{max-width:500px;color:var(--text-soft)}@media(max-width:600px),(max-height:600px){.arcade-page{padding:0}.arcade-page :deep(.arcade-shell){border-radius:0;border:0;min-height:0}}</style>
