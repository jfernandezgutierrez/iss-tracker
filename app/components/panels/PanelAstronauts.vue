<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useIss } from '../../composables/useIss'

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
    <p v-if="loadingAstronauts && !hasAstronauts" class="loading-msg">Cargando tripulación a bordo de la ISS…</p>
    <p v-else-if="errorAstronauts && !hasAstronauts" class="soft-error">{{ errorAstronauts }}</p>

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
              <p class="role" v-if="astronaut.role">
                <span class="badge badge-success">{{ astronaut.role }}</span>
              </p>
            </div>
          </div>

          <p v-if="astronaut.bio" class="bio">
            {{ astronaut.bio }}
          </p>

          <NuxtLink
            :to="{ path: '/tripulacion', query: { astronaut: astronaut.id } }"
            class="learn-more"
          >
            Saber más
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </NuxtLink>
        </article>
      </div>

      <p v-if="errorAstronauts" class="soft-error">
        No se pudo refrescar la lista en este ciclo.
      </p>
    </template>

    <p v-else class="loading-msg">No hay astronautas disponibles.</p>
  </div>
</template>

<style scoped>
.astronauts-grid {
  display: grid;
  gap: 12px;
}

.astronaut-card {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 14px;
  background: var(--surface-3);
  transition: background 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
}

.astronaut-card:hover {
  background: var(--surface-2);
  border-color: var(--primary);
  transform: translateY(-1px);
}

.astronaut-top {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.avatar-wrapper {
  flex-shrink: 0;
}

.avatar {
  width: 68px;
  height: 68px;
  border-radius: var(--radius-md);
  object-fit: cover;
  display: block;
  background: var(--surface-2);
  border: 1px solid var(--border);
}

.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--text);
  background: linear-gradient(135deg, var(--surface-2), #243754);
  font-size: 1.1rem;
}

.main-info {
  min-width: 0;
  flex: 1;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.name {
  margin: 0;
  font-size: 1rem;
  line-height: 1.2;
  color: var(--text);
  font-weight: 700;
}

.flag-img {
  width: 22px;
  height: 16px;
  object-fit: cover;
  border-radius: 3px;
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
  color: var(--text-soft);
  font-size: 0.88rem;
}

.role {
  text-transform: capitalize;
}

.bio {
  margin-top: 10px;
  color: var(--text-soft);
  font-size: 0.9rem;
  line-height: 1.55;
}

.learn-more {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--accent);
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease, color 0.2s ease;
}

.learn-more:hover {
  background: var(--surface);
  border-color: var(--accent);
  transform: translateX(2px);
}

.learn-more svg {
  transition: transform 0.2s ease;
}

.learn-more:hover svg {
  transform: translateX(2px);
}
</style>
