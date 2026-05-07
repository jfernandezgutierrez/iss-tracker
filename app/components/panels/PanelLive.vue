<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useNasaLive } from '../../composables/useNasaLive'

const { items, loading, error, loadNasaLive } = useNasaLive()

let interval: ReturnType<typeof setInterval> | null = null

const featured = computed(() => {
  const live = items.value.find(i => i.status === 'live')
  if (live) return live
  return items.value[0] || null
})

const embedUrl = computed(() => {
  if (!featured.value) return ''
  return `https://www.youtube.com/embed/${featured.value.videoId}?rel=0&modestbranding=1`
})

onMounted(() => {
  if (items.value.length === 0) {
    loadNasaLive()
  }
  // Refrescamos cada 3 min para cazar cambios de estado
  interval = setInterval(() => loadNasaLive(true), 3 * 60 * 1000)
})

onUnmounted(() => {
  if (interval) {
    clearInterval(interval)
    interval = null
  }
})
</script>

<template>
  <div class="section-content">
    <div v-if="loading" class="live-loading">
      <p>Buscando directos de la NASA y de la ISS…</p>
    </div>

    <template v-else>
      <div v-if="featured" class="video-wrapper">
        <iframe
          v-if="featured.status === 'live'"
          :src="embedUrl"
          :title="featured.title"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          referrerpolicy="strict-origin-when-cross-origin"
        ></iframe>

        <div
          v-else
          class="upcoming-cover"
          :style="featured.thumbnailUrl ? { backgroundImage: `url(${featured.thumbnailUrl})` } : undefined"
        >
          <div class="upcoming-overlay">
            <span class="upcoming-tag">Próximamente</span>
            <p class="upcoming-title">{{ featured.title }}</p>
          </div>
        </div>
      </div>

      <div class="live-info">
        <div class="live-header">
          <span
            v-if="featured && featured.status === 'live'"
            class="badge badge-live"
          >● LIVE</span>
          <span
            v-else-if="featured"
            class="badge badge-upcoming"
          >⏱ PRÓXIMO</span>
          <p class="live-title">
            {{ featured ? featured.title : 'La NASA no tiene directos activos en este momento' }}
          </p>
        </div>
        <p class="live-subtitle">
          {{ featured && featured.status === 'live'
            ? 'Emitiendo en directo desde el canal oficial de la NASA en YouTube'
            : 'Próxima emisión del canal oficial de la NASA' }}
        </p>

        <p v-if="error && !featured" class="live-error">{{ error }}</p>

        <NuxtLink to="/directos" class="btn btn-secondary btn-block live-link">
          Ver todos los directos de la NASA →
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<style scoped>
.video-wrapper {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: #000;
  border: 1px solid var(--border);
}

.video-wrapper iframe,
.upcoming-cover {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.upcoming-cover {
  background-color: #0b1222;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: flex-end;
}

.upcoming-overlay {
  width: 100%;
  padding: 12px 14px;
  background: linear-gradient(
    to top,
    rgba(8, 14, 28, 0.92) 0%,
    rgba(8, 14, 28, 0.5) 55%,
    rgba(8, 14, 28, 0) 100%
  );
}

.upcoming-tag {
  display: inline-block;
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  color: #4DA3FF;
  font-weight: 800;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.upcoming-title {
  margin: 0;
  color: var(--text);
  font-weight: 700;
  font-size: 0.95rem;
  line-height: 1.3;
}

.live-info {
  margin-top: 14px;
}

.live-header {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.live-title {
  margin: 0;
  color: var(--text);
  font-weight: 700;
}

.live-subtitle {
  margin: 4px 0 12px;
  color: var(--text-soft);
  font-size: 0.88rem;
}

.live-link {
  text-decoration: none;
  margin-top: 4px;
}

.live-loading {
  padding: 20px 0;
  text-align: center;
  color: var(--text-soft);
  font-size: 0.9rem;
}

.live-error {
  font-size: 0.82rem;
  color: #ffc0cb;
  margin: 0 0 10px;
}

.badge-upcoming {
  background: rgba(77, 163, 255, 0.18);
  color: #bcd8ff;
  border: 1px solid rgba(77, 163, 255, 0.4);
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}
</style>
