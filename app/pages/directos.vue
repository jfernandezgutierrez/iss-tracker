<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import IssSpinner from '../components/layout/IssSpinner.vue'
import { useNasaLive } from '../composables/useNasaLive'

useHead({
  title: 'Directos de la NASA — ISS, NASA TV y misiones en vivo',
  meta: [
    {
      name: 'description',
      content: 'Todos los directos oficiales de la NASA en un solo sitio: cámaras en vivo desde la ISS, NASA TV, lanzamientos, paseos espaciales y eventos programados. Detectamos automáticamente qué se está emitiendo ahora mismo en YouTube.'
    },
    {
      name: 'keywords',
      content: 'directos NASA, NASA TV en directo, ISS en vivo, cámara ISS, NASA YouTube, ver NASA en directo, lanzamientos NASA, paseos espaciales'
    },
    { property: 'og:title', content: 'Directos de la NASA — ISS, NASA TV y misiones en vivo' },
    {
      property: 'og:description',
      content: 'Ve las emisiones en directo de la NASA y la ISS, además de los próximos lanzamientos y eventos programados.'
    },
    { property: 'og:url', content: 'https://isstrackerlive.es/directos' }
  ],
  link: [
    { rel: 'canonical', href: 'https://isstrackerlive.es/directos' }
  ]
})

type StatusFilter = 'all' | 'live' | 'upcoming'
type TvSize = 'sm' | 'md'

const {
  items,
  loading,
  error,
  lastFetchedAt,
  usingFallback,
  loadNasaLive
} = useNasaLive()

const refreshing = ref(false)
const activeFilter = ref<StatusFilter>('all')
const tvSize = ref<TvSize>('md')

// ── Contenido estático para estado vacío ─────────────────────────────────────
const NASA_CHANNELS = [
  {
    id: 'NASA',
    name: 'NASA (canal principal)',
    desc: 'Lanzamientos, misiones, noticias y cobertura en directo de todos los programas.',
    url: 'https://www.youtube.com/@NASA/streams',
    thumb: 'https://i.ytimg.com/vi/21X5lGlDOfg/hqdefault_live.jpg',
    badge: '📡 NASA TV 24/7'
  },
  {
    id: 'NASAJohnson',
    name: 'NASA Johnson Space Center',
    desc: 'Directos del Centro Espacial Johnson: paseos espaciales, amarajes y actividad de la ISS.',
    url: 'https://www.youtube.com/@NASAJohnsonSpaceCenter/streams',
    thumb: 'https://i.ytimg.com/vi/sWasdbDVNvc/hqdefault_live.jpg',
    badge: '🚀 ISS & Artemis'
  },
  {
    id: 'NASAKennedy',
    name: 'NASA Kennedy Space Center',
    desc: 'Lanzamientos desde Cabo Cañaveral en directo y cobertura de missiones tripuladas.',
    url: 'https://www.youtube.com/@NASAKennedy/streams',
    thumb: 'https://i.ytimg.com/vi/nA9UZF-SZoQ/hqdefault.jpg',
    badge: '🛸 Lanzamientos'
  },
  {
    id: 'SpaceX',
    name: 'SpaceX',
    desc: 'Todos los lanzamientos de Falcon 9, Falcon Heavy y Starship con retransmisión oficial.',
    url: 'https://www.youtube.com/@SpaceX/streams',
    thumb: 'https://i.ytimg.com/vi/3PhNF6RRqB8/hqdefault.jpg',
    badge: '🐉 Crew Dragon'
  }
]

const FEATURED_VIDEOS = [
  { id: 'nA9UZF-SZoQ', title: 'ISS: Tour completo por la Estación Espacial Internacional', channel: 'NASA', year: '2023', duration: '50:00' },
  { id: 'sWasdbDVNvc', title: 'Tierra desde la ISS — Vista en directo 4K', channel: 'NASA', year: '2024', duration: 'LIVE' },
  { id: 'P9C25Un7xaM', title: 'Así viven y trabajan los astronautas en microgravedad', channel: 'NASA Johnson', year: '2022', duration: '18:42' },
  { id: '21X5lGlDOfg', title: 'NASA TV — Programación completa en directo', channel: 'NASA', year: '2024', duration: 'LIVE' },
  { id: 'BPVNpqkGVZ0', title: '25 años de la ISS: hitos y logros históricos', channel: 'NASA', year: '2023', duration: '28:15' },
  { id: '9V0_kkMaFk8', title: 'Paseo espacial EVA desde el exterior de la ISS', channel: 'NASA Johnson', year: '2023', duration: '6:34:00' }
]

const TIPS = [
  {
    icon: '🔔',
    title: 'Activa notificaciones en YouTube',
    text: 'Suscríbete al canal de NASA y activa la campana 🔔 para recibir una alerta en cuanto empiece cualquier directo.',
    url: 'https://www.youtube.com/@NASA?sub_confirmation=1',
    cta: 'Ir al canal de NASA'
  },
  {
    icon: '📅',
    title: 'Agenda de misiones NASA',
    text: 'La NASA publica el calendario oficial de lanzamientos, paseos espaciales y eventos con fechas y horas exactas.',
    url: 'https://www.nasa.gov/nasa-calendar/',
    cta: 'Ver calendario NASA'
  },
  {
    icon: '🐦',
    title: 'Sigue @NASA en redes',
    text: 'La cuenta oficial de NASA en X (Twitter) anuncia los directos con antelación y cubre los eventos en tiempo real.',
    url: 'https://twitter.com/NASA',
    cta: 'Seguir @NASA'
  },
  {
    icon: '📱',
    title: 'App NASA+',
    text: 'La plataforma oficial de NASA incluye directos, series documentales y cobertura exclusiva de misiones de forma gratuita.',
    url: 'https://plus.nasa.gov',
    cta: 'Abrir NASA+'
  }
]

let refreshInterval: ReturnType<typeof setInterval> | null = null

const filters: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'live', label: 'En directo' },
  { id: 'upcoming', label: 'Próximamente' }
]

const sizeOptions: { id: TvSize; label: string; icon: string }[] = [
  { id: 'sm', label: 'Pequeño', icon: '▫' },
  { id: 'md', label: 'Mediano', icon: '◻' }
]

const liveCount = computed(() => items.value.filter(i => i.status === 'live').length)
const upcomingCount = computed(() => items.value.filter(i => i.status === 'upcoming').length)

const visibleStreams = computed(() => {
  if (activeFilter.value === 'all') return items.value
  return items.value.filter(i => i.status === activeFilter.value)
})

const errorMsg = computed(() => {
  if (usingFallback.value) {
    return 'No hemos podido leer YouTube en este momento. Mostramos los directos estables de la ISS mientras tanto.'
  }
  return error.value
})

async function loadStreams(silent = false) {
  if (silent) refreshing.value = true
  await loadNasaLive(silent)
  refreshing.value = false
}

function embedUrl(id: string) {
  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`
}

function watchUrl(id: string) {
  return `https://www.youtube.com/watch?v=${id}`
}

function formatScheduled(iso?: string) {
  if (!iso) return 'Fecha por confirmar'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Fecha por confirmar'
  return date.toLocaleString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatLastFetched(ts: number | null) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadStreams()
  // Refrescamos cada 2 minutos en segundo plano para cazar cambios de estado
  refreshInterval = setInterval(() => loadStreams(true), 2 * 60 * 1000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
})
</script>

<template>
  <main class="content-page directos-page">
    <header class="page-header">
      <p class="eyebrow">Transmisiones oficiales de la NASA</p>
      <h1>Directos de la NASA y la ISS en tiempo real</h1>
      <p class="page-subtitle">
        Mira en directo las cámaras de la Estación Espacial Internacional, NASA TV y los próximos
        lanzamientos y eventos espaciales. Detectamos automáticamente qué se está emitiendo en vivo
        y qué viene después en el canal oficial de la NASA en YouTube.
      </p>

      <div v-if="!loading" class="status-summary">
        <span class="status-chip chip-live">
          <span class="dot"></span> {{ liveCount }} en directo
        </span>
        <span class="status-chip chip-upcoming">
          <span class="dot"></span> {{ upcomingCount }} próximamente
        </span>
        <button
          type="button"
          class="refresh-btn"
          :disabled="refreshing"
          @click="loadStreams(true)"
          aria-label="Refrescar directos"
        >
          <span class="refresh-icon" :class="{ spinning: refreshing }">↻</span>
          {{ refreshing ? 'Actualizando…' : 'Actualizar' }}
        </button>
        <span v-if="lastFetchedAt" class="last-updated">
          Actualizado a las {{ formatLastFetched(lastFetchedAt) }}
        </span>
      </div>
    </header>

    <div v-if="loading" class="initial-loading">
      <IssSpinner size="md" label="Consultando los directos de la NASA" />
    </div>

    <template v-else>
      <div class="toolbar">
        <div class="filters" role="tablist" aria-label="Filtrar directos">
          <button
            v-for="filter in filters"
            :key="filter.id"
            type="button"
            class="filter-chip"
            :class="{ active: activeFilter === filter.id }"
            @click="activeFilter = filter.id"
          >
            {{ filter.label }}
          </button>
        </div>

        <div class="size-control" role="group" aria-label="Tamaño de las pantallas">
          <span class="size-label">Tamaño</span>
          <div class="size-buttons">
            <button
              v-for="opt in sizeOptions"
              :key="opt.id"
              type="button"
              class="size-btn"
              :class="{ active: tvSize === opt.id }"
              :aria-pressed="tvSize === opt.id"
              :title="opt.label"
              @click="tvSize = opt.id"
            >
              <span class="size-icon" aria-hidden="true">{{ opt.icon }}</span>
              <span class="size-text">{{ opt.label }}</span>
            </button>
          </div>
        </div>
      </div>

      <p v-if="errorMsg && !items.length" class="error-banner">
        {{ errorMsg }}
      </p>
      <p v-else-if="usingFallback" class="stale-banner">
        {{ errorMsg }}
      </p>

      <section v-if="visibleStreams.length" class="tv-grid" :class="`size-${tvSize}`">
        <article
          v-for="stream in visibleStreams"
          :key="stream.id"
          class="tv-card"
          :class="`is-${stream.status}`"
        >
          <div class="tv-frame">
            <div class="tv-bezel-top">
              <span class="tv-led" :class="`led-${stream.status}`"></span>
              <span class="tv-label">
                NASA · {{ stream.status === 'live' ? 'En directo' : 'Próximamente' }}
              </span>
              <span v-if="stream.status === 'live'" class="tv-live">● LIVE</span>
              <span v-else class="tv-upcoming">⏱ PRÓXIMO</span>
            </div>

            <div class="tv-screen">
              <!-- Cuando está en directo incrustamos el reproductor -->
              <iframe
                v-if="stream.status === 'live'"
                :src="embedUrl(stream.videoId)"
                :title="stream.title"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
                referrerpolicy="strict-origin-when-cross-origin"
                loading="lazy"
              ></iframe>

              <!-- Para los próximos, miniatura con cuenta atrás y enlace -->
              <a
                v-else
                :href="watchUrl(stream.videoId)"
                target="_blank"
                rel="noopener noreferrer"
                class="tv-upcoming-cover"
                :style="stream.thumbnailUrl ? { backgroundImage: `url(${stream.thumbnailUrl})` } : undefined"
              >
                <div class="upcoming-overlay">
                  <div class="upcoming-time">
                    {{ formatScheduled(stream.scheduledStartTime) }}
                  </div>
                  <div class="upcoming-cta">Activar recordatorio en YouTube ↗</div>
                </div>
              </a>
            </div>

            <div class="tv-bezel-bottom">
              <span class="tv-knob"></span>
              <span class="tv-knob"></span>
              <span class="tv-brand">NASA-TV</span>
            </div>
          </div>

          <div class="tv-meta">
            <h2 class="tv-title">{{ stream.title }}</h2>
            <p v-if="stream.description" class="tv-description">{{ stream.description }}</p>
            <p v-if="stream.status === 'live' && stream.viewCountText" class="tv-viewers">
              👁 {{ stream.viewCountText }}
            </p>
            <a
              :href="watchUrl(stream.videoId)"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-secondary tv-external"
            >
              Abrir en YouTube ↗
            </a>
          </div>
        </article>
      </section>

      <!-- ── Estado vacío: contenido estático rico ── -->
      <div v-else class="empty-content">
        <div class="empty-header">
          <div class="empty-icon">📡</div>
          <h2 class="empty-title">
            <template v-if="activeFilter === 'live'">Sin directos activos ahora mismo</template>
            <template v-else-if="activeFilter === 'upcoming'">Sin eventos programados a la vista</template>
            <template v-else>Sin emisiones en este momento</template>
          </h2>
          <p class="empty-subtitle">
            La NASA emite regularmente lanzamientos, paseos espaciales, ruedas de prensa y cobertura
            de la ISS. Mientras tanto, aquí tienes los canales y recursos oficiales para no perderte nada.
          </p>
        </div>

        <!-- Canales permanentes -->
        <section class="static-section">
          <h3 class="static-section-title">📺 Canales oficiales de la NASA</h3>
          <div class="channels-grid">
            <a
              v-for="ch in NASA_CHANNELS"
              :key="ch.id"
              :href="ch.url"
              target="_blank"
              rel="noopener noreferrer"
              class="channel-card"
            >
              <div class="channel-thumb">
                <img :src="ch.thumb" :alt="ch.name" loading="lazy" />
                <div class="channel-play">▶</div>
              </div>
              <div class="channel-info">
                <div class="channel-name">{{ ch.name }}</div>
                <div class="channel-desc">{{ ch.desc }}</div>
                <div class="channel-badge">{{ ch.badge }}</div>
              </div>
            </a>
          </div>
        </section>

        <!-- Vídeos destacados -->
        <section class="static-section">
          <h3 class="static-section-title">🎬 Vídeos imprescindibles sobre la ISS</h3>
          <div class="videos-grid">
            <a
              v-for="v in FEATURED_VIDEOS"
              :key="v.id"
              :href="`https://www.youtube.com/watch?v=${v.id}`"
              target="_blank"
              rel="noopener noreferrer"
              class="video-card"
            >
              <div class="video-thumb">
                <img :src="`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`" :alt="v.title" loading="lazy" />
                <div class="video-duration">{{ v.duration }}</div>
                <div class="video-play">▶</div>
              </div>
              <div class="video-info">
                <div class="video-title">{{ v.title }}</div>
                <div class="video-meta">{{ v.channel }} · {{ v.year }}</div>
              </div>
            </a>
          </div>
        </section>

        <!-- Dónde seguir la NASA -->
        <section class="static-section">
          <h3 class="static-section-title">🔔 Cómo no perderte el próximo directo</h3>
          <div class="tips-grid">
            <div v-for="tip in TIPS" :key="tip.title" class="tip-card">
              <div class="tip-icon">{{ tip.icon }}</div>
              <div class="tip-body">
                <div class="tip-title">{{ tip.title }}</div>
                <div class="tip-text">{{ tip.text }}</div>
                <a v-if="tip.url" :href="tip.url" target="_blank" rel="noopener noreferrer" class="tip-link">{{ tip.cta }} ↗</a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </template>
  </main>
</template>

<style scoped>
.directos-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 28px 20px 60px;
}

.page-header {
  text-align: center;
  margin-bottom: 18px;
}

.page-header h1 {
  margin: 6px 0 10px;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  color: var(--text);
}

.page-subtitle {
  color: var(--text-soft);
  max-width: 640px;
  margin: 0 auto;
  font-size: 0.98rem;
}

/* =================== Resumen de estado =================== */
.status-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  align-items: center;
  margin-top: 16px;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface-2);
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--text);
}

.status-chip .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.chip-live {
  border-color: rgba(255, 85, 119, 0.45);
  background: rgba(255, 85, 119, 0.12);
  color: #ffb0bf;
}

.chip-live .dot {
  background: #ff5577;
  box-shadow: 0 0 10px rgba(255, 85, 119, 0.8);
  animation: led-pulse 2s ease-in-out infinite;
}

.chip-upcoming {
  border-color: rgba(77, 163, 255, 0.4);
  background: rgba(77, 163, 255, 0.1);
  color: #bcd8ff;
}

.chip-upcoming .dot {
  background: #4DA3FF;
  box-shadow: 0 0 10px rgba(77, 163, 255, 0.6);
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}

.refresh-btn:hover:not(:disabled) {
  border-color: var(--primary);
  transform: translateY(-1px);
}

.refresh-btn:disabled {
  opacity: 0.7;
  cursor: default;
}

.refresh-icon {
  display: inline-block;
  transition: transform 0.3s ease;
}

.refresh-icon.spinning {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.last-updated {
  color: var(--text-soft);
  font-size: 0.78rem;
}

/* =================== Loading inicial =================== */
.initial-loading {
  display: flex;
  justify-content: center;
  padding: 50px 0 20px;
}

/* =================== Banners =================== */
.error-banner,
.stale-banner {
  max-width: 640px;
  margin: 0 auto 24px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  text-align: center;
}

.error-banner {
  background: rgba(255, 85, 119, 0.12);
  border: 1px solid rgba(255, 85, 119, 0.4);
  color: #ffc0cb;
}

.stale-banner {
  background: rgba(255, 175, 77, 0.1);
  border: 1px solid rgba(255, 175, 77, 0.35);
  color: #ffd89a;
}

/* =================== Toolbar (filtros + tamaño) =================== */
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 22px;
  align-items: center;
  justify-content: space-between;
  margin: 22px 0 28px;
}

/* =================== Filtros =================== */
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-start;
  flex: 1 1 auto;
}

.filter-chip {
  padding: 8px 16px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text-soft);
  border-radius: 999px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}

.filter-chip:hover {
  color: var(--text);
  border-color: var(--primary);
  transform: translateY(-1px);
}

.filter-chip.active {
  background: var(--primary);
  color: #07111F;
  border-color: var(--primary-strong);
  box-shadow: 0 0 18px var(--glow);
}

/* =================== Control de tamaño =================== */
.size-control {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
}

.size-label {
  color: var(--text-soft);
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.size-buttons {
  display: inline-flex;
  padding: 4px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 999px;
  gap: 2px;
}

.size-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: 999px;
  color: var(--text-soft);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease, transform 0.15s ease;
}

.size-btn:hover {
  color: var(--text);
  background: var(--surface-3);
}

.size-btn.active {
  background: var(--primary);
  color: #07111F;
  box-shadow: 0 0 14px var(--glow);
}

.size-icon {
  font-size: 0.9rem;
  line-height: 1;
}

/* =================== Rejilla de TVs =================== */
.tv-grid {
  display: grid;
  gap: 22px;
  --tv-min: 420px;
  grid-template-columns: repeat(auto-fill, minmax(var(--tv-min), 1fr));
  transition: gap 0.25s ease;
}

.tv-grid.size-sm {
  --tv-min: 280px;
  gap: 18px;
}

.tv-grid.size-md {
  --tv-min: 420px;
  gap: 22px;
}

.tv-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  animation: tv-in 0.4s ease both;
}

@keyframes tv-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* =================== Marco estilo TV retro =================== */
.tv-frame {
  position: relative;
  border-radius: var(--radius-lg);
  padding: 10px;
  background: linear-gradient(145deg, #13203a 0%, #0a1222 100%);
  border: 1px solid var(--border);
  box-shadow:
    0 20px 40px -20px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.tv-frame:hover {
  transform: translateY(-4px);
  box-shadow:
    0 28px 48px -20px rgba(0, 0, 0, 0.75),
    0 0 24px rgba(77, 163, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.is-upcoming .tv-frame {
  background: linear-gradient(145deg, #0f1b34 0%, #080f1c 100%);
}

.tv-bezel-top {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px 8px;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-soft);
  font-weight: 700;
}

.tv-led {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.led-live {
  background: #6EF2D8;
  box-shadow: 0 0 10px #6EF2D8;
  animation: led-pulse 2s ease-in-out infinite;
}

.led-upcoming {
  background: #4DA3FF;
  box-shadow: 0 0 8px rgba(77, 163, 255, 0.8);
}

@keyframes led-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

.tv-label {
  flex: 1;
}

.tv-live {
  color: #ff5577;
  font-weight: 800;
  letter-spacing: 0.1em;
  animation: live-blink 2.2s ease-in-out infinite;
}

.tv-upcoming {
  color: #4DA3FF;
  font-weight: 800;
  letter-spacing: 0.08em;
}

@keyframes live-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}

.tv-screen {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  border-radius: calc(var(--radius-lg) - 4px);
  overflow: hidden;
  background: #000;
  border: 1px solid #0d1525;
  box-shadow: inset 0 0 24px rgba(0, 0, 0, 0.8);
}

.tv-screen::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.02) 0 2px,
    transparent 2px 4px
  );
  mix-blend-mode: overlay;
  z-index: 2;
}

.tv-screen iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* Cubierta para vídeos próximos */
.tv-upcoming-cover {
  position: absolute;
  inset: 0;
  z-index: 1;
  background-color: #0b1222;
  background-size: cover;
  background-position: center;
  text-decoration: none;
  color: var(--text);
  display: flex;
  align-items: flex-end;
  transition: filter 0.25s ease;
}

.tv-upcoming-cover:hover {
  filter: brightness(1.1);
}

.upcoming-overlay {
  width: 100%;
  padding: 14px 16px;
  background: linear-gradient(
    to top,
    rgba(8, 14, 28, 0.95) 0%,
    rgba(8, 14, 28, 0.55) 55%,
    rgba(8, 14, 28, 0) 100%
  );
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.upcoming-time {
  font-size: 0.95rem;
  font-weight: 700;
  color: #bcd8ff;
  text-transform: capitalize;
}

.upcoming-cta {
  font-size: 0.78rem;
  color: var(--text-soft);
  letter-spacing: 0.04em;
}

.tv-bezel-bottom {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px 4px;
}

.tv-knob {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #2a3c5f, #0b1322);
  border: 1px solid #1f2d49;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.tv-brand {
  margin-left: auto;
  font-size: 0.68rem;
  letter-spacing: 0.18em;
  color: var(--text-soft);
  font-weight: 700;
  opacity: 0.7;
}

/* =================== Metadatos =================== */
.tv-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 4px;
}

.tv-title {
  margin: 0;
  font-size: 1.05rem;
  color: var(--text);
  font-weight: 700;
  line-height: 1.3;
}

.tv-description {
  margin: 0;
  color: var(--text-soft);
  font-size: 0.88rem;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tv-viewers {
  margin: 0;
  font-size: 0.82rem;
  color: #ffb0bf;
  font-weight: 600;
}

.tv-external {
  align-self: flex-start;
  margin-top: 6px;
  text-decoration: none;
  font-size: 0.84rem;
  padding: 6px 12px;
}

/* ── Estado vacío enriquecido ── */
.empty-content {
  display: flex;
  flex-direction: column;
  gap: 48px;
  padding-top: 8px;
}

.empty-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon {
  font-size: 3rem;
  filter: drop-shadow(0 0 16px var(--glow));
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

.empty-subtitle {
  max-width: 560px;
  color: var(--text-soft);
  font-size: 0.97rem;
  line-height: 1.65;
  margin: 0;
}

.static-section {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.static-section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}

/* Canales */
.channels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.channel-card {
  display: flex;
  gap: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 16px;
  text-decoration: none;
  color: var(--text);
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.channel-card:hover {
  border-color: var(--primary);
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.4), 0 0 18px var(--glow);
}

.channel-thumb {
  position: relative;
  width: 88px;
  height: 56px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
  background: var(--surface-2);
}

.channel-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.channel-play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.45);
  color: #fff;
  font-size: 1rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.channel-card:hover .channel-play {
  opacity: 1;
}

.channel-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.channel-name {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text);
}

.channel-desc {
  font-size: 0.78rem;
  color: var(--text-soft);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.channel-badge {
  font-size: 0.72rem;
  color: var(--accent);
  font-weight: 700;
}

/* Vídeos destacados */
.videos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.video-card {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  text-decoration: none;
  color: var(--text);
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.video-card:hover {
  border-color: var(--primary);
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.4), 0 0 18px var(--glow);
}

.video-thumb {
  position: relative;
  aspect-ratio: 16 / 9;
  background: var(--surface-2);
  overflow: hidden;
}

.video-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

.video-card:hover .video-thumb img {
  transform: scale(1.05);
}

.video-duration {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background: rgba(0,0,0,0.8);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.video-play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.4);
  color: #fff;
  font-size: 1.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.video-card:hover .video-play {
  opacity: 1;
}

.video-info {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.video-title {
  font-size: 0.87rem;
  font-weight: 600;
  color: var(--text);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-meta {
  font-size: 0.75rem;
  color: var(--text-dim);
}

/* Tips */
.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}

.tip-card {
  display: flex;
  gap: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 18px;
  transition: border-color 0.2s ease;
}

.tip-card:hover {
  border-color: var(--primary);
}

.tip-icon {
  font-size: 1.6rem;
  flex-shrink: 0;
}

.tip-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tip-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text);
}

.tip-text {
  font-size: 0.82rem;
  color: var(--text-soft);
  line-height: 1.5;
}

.tip-link {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--primary);
  text-decoration: none;
  margin-top: 4px;
}

.tip-link:hover {
  color: var(--accent);
}

@media (max-width: 720px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 14px;
  }

  .filters {
    justify-content: center;
  }

  .size-control {
    justify-content: center;
  }
}

@media (max-width: 560px) {
  .directos-page {
    padding: 20px 14px 50px;
  }

  .tv-grid,
  .tv-grid.size-sm,
  .tv-grid.size-md {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .size-text {
    display: none;
  }

  .size-btn {
    padding: 6px 10px;
  }
}
</style>
