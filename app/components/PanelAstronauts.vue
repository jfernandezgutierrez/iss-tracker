<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useIss } from '../composables/useIss'

const {
  astronauts,
  loadingAstronauts,
  errorAstronauts,
  loadAstronauts
} = useIss()

const hasAstronauts = computed(() => astronauts.value.length > 0)

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('')
}

function fallbackFlag(country: string | null) {
  if (!country) return '🌍'

  const normalized = country.toLowerCase()

  if (normalized.includes('usa') || normalized.includes('united states')) return '🇺🇸'
  if (normalized.includes('japan')) return '🇯🇵'
  if (normalized.includes('france')) return '🇫🇷'
  if (normalized.includes('italy')) return '🇮🇹'
  if (normalized.includes('canada')) return '🇨🇦'
  if (normalized.includes('russia')) return '🇷🇺'
  if (normalized.includes('european')) return '🇪🇺'
  if (normalized.includes('germany')) return '🇩🇪'
  if (normalized.includes('spain')) return '🇪🇸'

  return '🌍'
}

onMounted(async () => {
  if (!astronauts.value.length) {
    await loadAstronauts()
  }
})
</script>

<template>
  <div class="section-content">
    <p v-if="loadingAstronauts && !hasAstronauts">Cargando astronautas...</p>
    <p v-else-if="errorAstronauts && !hasAstronauts">{{ errorAstronauts }}</p>

    <template v-else-if="hasAstronauts">
      <div class="astronauts-grid">
        <article
          v-for="astronaut in astronauts"
          :key="astronaut.id"
          class="astronaut-card"
        >
          <div class="astronaut-top">
            <div class="avatar-wrapper">
              <img
                v-if="astronaut.image"
                :src="astronaut.image"
                :alt="astronaut.name"
                class="avatar"
              />
              <div v-else class="avatar avatar-fallback">
                {{ initials(astronaut.name) }}
              </div>
            </div>

            <div class="main-info">
              <div class="name-row">
                <h3 class="name">{{ astronaut.name }}</h3>

                <img
                  v-if="astronaut.flag"
                  :src="astronaut.flag"
                  :alt="astronaut.country || 'Bandera'"
                  class="flag-img"
                />

                <span v-else class="flag-emoji">
                  {{ fallbackFlag(astronaut.country) }}
                </span>
              </div>

              <p class="meta" v-if="astronaut.country">{{ astronaut.country }}</p>
              <p class="meta" v-if="astronaut.agency">{{ astronaut.agency }}</p>
              <p class="role" v-if="astronaut.role">{{ astronaut.role }}</p>
            </div>
          </div>

          <p v-if="astronaut.bio" class="bio">
            {{ astronaut.bio }}
          </p>
        </article>
      </div>

      <p v-if="errorAstronauts" class="soft-error">
        No se pudo refrescar la lista en este ciclo.
      </p>
    </template>

    <p v-else>No hay astronautas disponibles.</p>
  </div>
</template>

<style scoped>
.astronauts-grid {
  display: grid;
  gap: 12px;
}

.astronaut-card {
  border: 1px solid #2b2b2b;
  border-radius: 12px;
  padding: 12px;
  background: #171717;
}

.astronaut-top {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.avatar-wrapper {
  flex-shrink: 0;
}

.avatar {
  width: 68px;
  height: 68px;
  border-radius: 12px;
  object-fit: cover;
  display: block;
  background: #242424;
}

.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #fff;
  background: #2a2a2a;
}

.main-info {
  min-width: 0;
  flex: 1;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.name {
  margin: 0;
  font-size: 16px;
  line-height: 1.2;
}

.flag-img {
  width: 22px;
  height: 16px;
  object-fit: cover;
  border-radius: 2px;
}

.flag-emoji {
  font-size: 18px;
  line-height: 1;
}

.meta,
.role,
.bio {
  margin: 6px 0 0;
}

.meta {
  color: #cfcfcf;
  font-size: 14px;
}

.role {
  color: #9fd3ff;
  font-size: 13px;
  text-transform: capitalize;
}

.bio {
  margin-top: 10px;
  color: #d9d9d9;
  font-size: 14px;
  line-height: 1.45;
}

.soft-error {
  margin-top: 10px;
  font-size: 12px;
  color: #ffb3b3;
}
</style>