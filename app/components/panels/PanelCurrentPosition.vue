<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useIss } from '../../composables/useIss'
import IssSpinner from '../layout/IssSpinner.vue'

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
    <div v-if="loadingPosition && !position" class="loading-state">
      <IssSpinner size="sm" label="Cargando posición" />
    </div>
    <p v-else-if="errorPosition && !position" class="soft-error">{{ errorPosition }}</p>

    <template v-else>
      <div class="section-header">
        <span class="status-pill">
          {{ refreshingPosition ? 'Actualizando...' : 'En tiempo real' }}
        </span>
      </div>

      <div class="data-grid">
        <div class="mini-info-card">
          <div class="mini-info-label">Latitud</div>
          <div class="mini-info-value">{{ formattedLat }}</div>
        </div>
        <div class="mini-info-card">
          <div class="mini-info-label">Longitud</div>
          <div class="mini-info-value">{{ formattedLng }}</div>
        </div>
        <div class="mini-info-card">
          <div class="mini-info-label">Altitud</div>
          <div class="mini-info-value">{{ formattedAltitude }} km</div>
        </div>
        <div class="mini-info-card">
          <div class="mini-info-label">Velocidad</div>
          <div class="mini-info-value">{{ formattedVelocity }} km/h</div>
        </div>
      </div>

      <p class="timestamp">
        <span class="timestamp-label">Visibilidad:</span>
        <strong>{{ position?.visibility || '--' }}</strong>
      </p>
      <p class="timestamp">
        <span class="timestamp-label">Última actualización:</span>
        <strong>{{ formattedTimestamp }}</strong>
      </p>

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
  margin-bottom: 14px;
}

.data-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 14px;
}

.timestamp {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid var(--border-soft);
  font-size: 0.88rem;
}

.timestamp-label {
  color: var(--text-soft);
}

.timestamp strong {
  color: var(--text);
  font-weight: 600;
}

.loading-msg {
  color: var(--text-soft);
  font-size: 0.92rem;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}
</style>
