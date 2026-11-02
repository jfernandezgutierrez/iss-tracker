<script setup lang="ts">
import { computed } from 'vue'
import { worldMaps, type GameSlug } from '#shared/games/progression'
const props = defineProps<{ game: GameSlug; best: number }>()
const next = computed(() => worldMaps[props.game].find(map => map.unlock > props.best))
const unit = computed(() => props.game === 'iss-runner' ? 'm' : 'puntos')
</script>
<template>
  <div class="next-map">
    <template v-if="next"><span>PRÓXIMO DESTINO · {{ next.name }}</span><progress :value="best" :max="next.unlock" :aria-label="`Desbloquear ${next.name}`"/><small>Tu récord: {{ best }} / {{ next.unlock }} {{ unit }} · Faltan {{ next.unlock-best }} {{ unit }}</small></template>
    <span v-else>✓ Has desbloqueado todos los destinos</span>
  </div>
</template>
<style scoped>
.next-map{width:min(100%,340px);display:flex;flex-direction:column;gap:7px;padding:12px 14px;background:#142d3b;border:1px solid #305363;border-radius:12px;text-align:left}.next-map span{font-size:10px;color:#bde9dc;letter-spacing:.04em}.next-map small{font-size:10px;color:#a4c4cc}.next-map progress{width:100%;height:6px;accent-color:#78e0cb}
</style>
