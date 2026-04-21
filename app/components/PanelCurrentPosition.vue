<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useIss } from '../composables/useIss'

const {
  position,
  loadingPosition,
  refreshingPosition,
  errorPosition,
  loadPosition,
  startPositionPolling,
  stopPositionPolling
} = useIss()

const formattedLat = computed(() => {
  if (!position.value) return '--'
  return position.value.latitude.toFixed(4)
})

const formattedLng = computed(() => {
  if (!position.value) return '--'
  return position.value.longitude.toFixed(4)
})

const formattedAltitude = computed(() => {
  if (position.value?.altitude == null) return '--'
  return position.value.altitude.toFixed(2)
})

const formattedVelocity = computed(() => {
  if (position.value?.velocity == null) return '--'
  return Math.round(position.value.velocity).toLocaleString('es-ES')
})

const formattedTimestamp = computed(() => {
  if (!position.value?.timestamp) return '--'
  return new Date(position.value.timestamp * 1000).toLocaleString('es-ES')
})

onMounted(async () => {
  if (!position.value) {
    await loadPosition()
  }

  startPositionPolling(5000)
})

onUnmounted(() => {
  stopPositionPolling()
})
</script>

<template>
  <div class="section-content">
    <p v-if="loadingPosition && !position">Cargando posición actual...</p>
    <p v-else-if="errorPosition && !position">{{ errorPosition }}</p>

    <template v-else>
      <div class="section-header">
        <span class="status">
          {{ refreshingPosition ? 'Actualizando...' : 'En tiempo real' }}
        </span>
      </div>

      <p><strong>Latitud:</strong> {{ formattedLat }}</p>
      <p><strong>Longitud:</strong> {{ formattedLng }}</p>
      <p><strong>Altitud:</strong> {{ formattedAltitude }} km</p>
      <p><strong>Velocidad:</strong> {{ formattedVelocity }} km/h</p>
      <p><strong>Visibilidad:</strong> {{ position?.visibility || '--' }}</p>
      <p><strong>Última actualización:</strong> {{ formattedTimestamp }}</p>

      <p v-if="errorPosition" class="soft-error">
        No se pudo actualizar en este ciclo.
      </p>
    </template>
  </div>
</template>

<style scoped>
.section-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.status {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 999px;
  background: #2a2a2a;
  color: #ddd;
}

.soft-error {
  margin-top: 10px;
  font-size: 12px;
  color: #ffb3b3;
}
</style>