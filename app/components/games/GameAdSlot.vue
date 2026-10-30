<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { GameAds, type AdPlacement, type AdState } from '#shared/games/ads'
const props = defineProps<{ placement: AdPlacement }>()
const config = useRuntimeConfig()
const state = ref<AdState>('disabled')
onMounted(async () => {
  let consent = false
  try { consent = localStorage.getItem('iss-games-ad-consent-v1') === 'granted' } catch {}
  state.value = (await new GameAds(config.public.gameAdsTestMode === true || String(config.public.gameAdsTestMode) === 'true').request(props.placement, consent)).state
})
</script>
<template><aside v-if="state === 'test'" class="glass-card" aria-label="Espacio publicitario de prueba">Espacio de prueba · No se ha cargado publicidad real.</aside></template>
