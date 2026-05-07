<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useIss } from '../composables/useIss'

useHead({
  title: 'Tripulación de la ISS — Astronautas a bordo ahora mismo',
  meta: [
    {
      name: 'description',
      content: 'Descubre quién está a bordo de la Estación Espacial Internacional en tiempo real: nombres, países, agencias espaciales (NASA, ESA, Roscosmos, JAXA, CSA) y perfil de cada astronauta de la tripulación actual de la ISS.'
    },
    {
      name: 'keywords',
      content: 'tripulación ISS, astronautas ISS, quién está en la ISS, astronautas a bordo Estación Espacial Internacional, tripulación actual NASA, cosmonautas ISS'
    },
    { property: 'og:title', content: 'Tripulación de la ISS — Astronautas a bordo ahora mismo' },
    {
      property: 'og:description',
      content: 'Todos los astronautas que ocupan la Estación Espacial Internacional en este momento, con su país, agencia y rol.'
    },
    { property: 'og:url', content: 'https://isstrackerlive.es/tripulacion' }
  ],
  link: [
    { rel: 'canonical', href: 'https://isstrackerlive.es/tripulacion' }
  ]
})

const route = useRoute()
const router = useRouter()

const {
  astronauts,
  loadingAstronauts,
  errorAstronauts,
  loadAstronauts
} = useIss()

const expandedId = ref<string | null>(null)
const cardRefs = ref<Record<string, HTMLElement | null>>({})

const hasAstronauts = computed(() => astronauts.value.length > 0)

function setCardRef(id: string, el: Element | null) {
  cardRefs.value[id] = el as HTMLElement | null
}

async function scrollToCard(id: string) {
  await nextTick()
  const el = cardRefs.value[id]
  if (!el) return

  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function toggleExpand(id: string) {
  const nextId = expandedId.value === id ? null : id
  expandedId.value = nextId

  // Mantén la URL limpia al abrir/cerrar desde la propia página
  const currentQuery = route.query.astronaut
  if (nextId && currentQuery !== nextId) {
    router.replace({ query: { ...route.query, astronaut: nextId } })
  } else if (!nextId && currentQuery) {
    const { astronaut: _removed, ...rest } = route.query
    router.replace({ query: rest })
  }
}

function isExpanded(id: string) {
  return expandedId.value === id
}

function applyQueryExpand() {
  const requested = Array.isArray(route.query.astronaut)
    ? route.query.astronaut[0]
    : route.query.astronaut

  if (!requested || typeof requested !== 'string') return

  const exists = astronauts.value.some(a => a.id === requested)
  if (!exists) return

  expandedId.value = requested
  scrollToCard(requested)
}

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

function roleLabel(role: string | null) {
  if (!role) return 'Astronauta'
  const normalized = role.toLowerCase()
  if (normalized.includes('commander')) return 'Comandante'
  if (normalized.includes('flight engineer')) return 'Ingeniero de vuelo'
  if (normalized.includes('specialist')) return 'Especialista'
  return role
}

onMounted(async () => {
  if (!astronauts.value.length) {
    await loadAstronauts()
  }
  applyQueryExpand()
})

// Si la tripulación llega de forma asíncrona o cambia la query mientras
// ya estamos en la página, reintenta la expansión.
watch(() => astronauts.value.length, (length) => {
  if (length > 0 && route.query.astronaut && !expandedId.value) {
    applyQueryExpand()
  }
})

watch(() => route.query.astronaut, (value) => {
  if (typeof value === 'string' && value) {
    const exists = astronauts.value.some(a => a.id === value)
    if (exists) {
      expandedId.value = value
      scrollToCard(value)
    }
  }
})
</script>

<template>
  <div class="crew-page">
    <header class="crew-hero">
      <p class="eyebrow">En órbita ahora</p>
      <h1 class="display-title">Tripulación actual de la Estación Espacial Internacional</h1>
      <p class="hero-text">
        Estos son los astronautas y cosmonautas que se encuentran ahora mismo a bordo de la ISS
        orbitando la Tierra. Consulta su nacionalidad, agencia espacial (NASA, ESA, Roscosmos,
        JAXA o CSA) y rol en la misión. Pulsa sobre cualquier tarjeta para ampliar la información
        del astronauta.
      </p>

      <div class="crew-stats">
        <span class="badge badge-live">● Live</span>
        <span class="status-pill">
          {{ hasAstronauts ? `${astronauts.length} a bordo` : 'Cargando…' }}
        </span>
      </div>
    </header>

    <section v-if="loadingAstronauts && !hasAstronauts" class="loading-state">
      <div class="skeleton-grid">
        <div v-for="n in 6" :key="n" class="skeleton-card"></div>
      </div>
    </section>

    <section v-else-if="errorAstronauts && !hasAstronauts" class="error-state panel-card">
      <h2 class="section-title">No se ha podido cargar la tripulación</h2>
      <p class="section-subtitle">{{ errorAstronauts }}</p>
      <button class="btn btn-primary" @click="loadAstronauts">Reintentar</button>
    </section>

    <section v-else class="crew-grid">
      <article
        v-for="astronaut in astronauts"
        :key="astronaut.id"
        :ref="(el) => setCardRef(astronaut.id, el as Element | null)"
        :class="['crew-card', { 'is-expanded': isExpanded(astronaut.id) }]"
        @click="toggleExpand(astronaut.id)"
      >
        <div class="crew-card-header">
          <div class="avatar-wrapper">
            <img
              v-if="astronaut.image"
              :src="astronaut.image"
              :alt="astronaut.name"
              class="avatar"
              loading="lazy"
            />
            <div v-else class="avatar avatar-fallback">
              {{ initials(astronaut.name) }}
            </div>
            <span class="live-dot" aria-hidden="true"></span>
          </div>

          <div class="crew-card-intro">
            <div class="name-row">
              <h2 class="crew-name">{{ astronaut.name }}</h2>
              <img
                v-if="astronaut.flag"
                :src="astronaut.flag"
                :alt="astronaut.country || 'Bandera'"
                class="flag-img"
              />
              <span v-else class="flag-emoji">{{ fallbackFlag(astronaut.country) }}</span>
            </div>

            <p class="crew-role">{{ roleLabel(astronaut.role) }}</p>

            <div class="crew-meta">
              <span v-if="astronaut.country" class="chip">{{ astronaut.country }}</span>
              <span v-if="astronaut.agency" class="chip chip-agency">{{ astronaut.agency }}</span>
            </div>
          </div>

          <button
            class="expand-toggle"
            :aria-expanded="isExpanded(astronaut.id)"
            :aria-label="isExpanded(astronaut.id) ? 'Cerrar detalles' : 'Ver detalles'"
            @click.stop="toggleExpand(astronaut.id)"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>

        <Transition name="details">
          <div v-if="isExpanded(astronaut.id)" class="crew-details" @click.stop>
            <div class="details-grid">
              <div class="mini-info-card">
                <div class="mini-info-label">País</div>
                <div class="mini-info-value">{{ astronaut.country || '—' }}</div>
              </div>
              <div class="mini-info-card">
                <div class="mini-info-label">Agencia</div>
                <div class="mini-info-value">{{ astronaut.agency || '—' }}</div>
              </div>
              <div class="mini-info-card">
                <div class="mini-info-label">Rol</div>
                <div class="mini-info-value">{{ roleLabel(astronaut.role) }}</div>
              </div>
              <div class="mini-info-card">
                <div class="mini-info-label">Estado</div>
                <div class="mini-info-value">
                  <span class="badge badge-success">En misión</span>
                </div>
              </div>
            </div>

            <div class="details-bio">
              <h3 class="bio-title">Sobre {{ astronaut.name.split(' ')[0] }}</h3>
              <p v-if="astronaut.bio" class="bio-text">{{ astronaut.bio }}</p>
              <p v-else class="bio-text">
                {{ astronaut.name }} forma parte de la tripulación activa de la Estación Espacial
                Internacional, donde participa en investigaciones científicas en microgravedad,
                mantenimiento de la estación y operaciones orbitales diarias.
              </p>
            </div>

            <div class="details-footer">
              <a
                :href="`https://www.google.com/search?q=${encodeURIComponent(astronaut.name + ' astronaut ISS')}`"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-secondary"
                @click.stop
              >
                Saber más
              </a>
              <button class="btn btn-ghost" @click.stop="expandedId = null">
                Cerrar
              </button>
            </div>
          </div>
        </Transition>
      </article>
    </section>

    <p v-if="hasAstronauts && errorAstronauts" class="soft-error footer-error">
      No se pudo refrescar la lista en este ciclo.
    </p>
  </div>
</template>

<style scoped>
.crew-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px 64px;
  color: var(--text);
}

/* ===================== Hero ===================== */
.crew-hero {
  border: 1px solid var(--border);
  border-radius: var(--radius-2xl);
  background: linear-gradient(135deg, #0B1220 0%, var(--surface) 55%, #0B1830 100%);
  padding: 40px 32px;
  margin-bottom: 32px;
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
}

.crew-hero::after {
  content: '';
  position: absolute;
  top: -40%;
  right: -20%;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--glow) 0%, transparent 60%);
  pointer-events: none;
}

.crew-hero .display-title {
  margin: 0 0 12px;
  position: relative;
}

.hero-text {
  position: relative;
  max-width: 640px;
  color: var(--text-soft);
  font-size: 1.05rem;
  line-height: 1.7;
  margin: 0 0 20px;
}

.crew-stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  position: relative;
}

/* ===================== Grid ===================== */
.crew-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
  align-items: start;
}

.crew-card {
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  background: var(--surface);
  padding: 20px;
  cursor: pointer;
  transition: border-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
  box-shadow: var(--shadow-soft);
}

.crew-card:hover {
  border-color: var(--primary);
  transform: translateY(-3px);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.45), 0 0 24px var(--glow);
}

.crew-card.is-expanded {
  border-color: var(--accent);
  background: linear-gradient(180deg, var(--surface) 0%, var(--surface-3) 100%);
  grid-column: span 2;
  cursor: default;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px var(--glow-accent);
}

@media (max-width: 820px) {
  .crew-card.is-expanded {
    grid-column: span 1;
  }
}

.crew-card-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

/* ===================== Avatar ===================== */
.avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.avatar {
  width: 88px;
  height: 88px;
  border-radius: var(--radius-lg);
  object-fit: cover;
  display: block;
  background: var(--surface-2);
  border: 1px solid var(--border);
  transition: transform 0.3s ease, width 0.3s ease, height 0.3s ease;
}

.crew-card.is-expanded .avatar {
  width: 120px;
  height: 120px;
}

.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--text);
  background: linear-gradient(135deg, var(--surface-2), #243754);
  font-size: 1.35rem;
}

.live-dot {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent);
  border: 3px solid var(--surface);
  box-shadow: 0 0 12px var(--glow-accent);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--glow-accent); }
  50% { box-shadow: 0 0 0 8px rgba(110, 242, 216, 0); }
}

/* ===================== Intro ===================== */
.crew-card-intro {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.crew-name {
  margin: 0;
  color: var(--text);
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1.2;
}

.flag-img {
  width: 24px;
  height: 18px;
  object-fit: cover;
  border-radius: 3px;
}

.flag-emoji {
  font-size: 20px;
  line-height: 1;
}

.crew-role {
  margin: 6px 0 12px;
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.crew-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip-agency {
  color: var(--primary);
  border-color: rgba(77, 163, 255, 0.35);
  background: rgba(77, 163, 255, 0.1);
}

/* ===================== Expand toggle ===================== */
.expand-toggle {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text-soft);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease, background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.expand-toggle:hover {
  background: var(--primary);
  color: #07111F;
  border-color: var(--primary-strong);
}

.crew-card.is-expanded .expand-toggle {
  transform: rotate(180deg);
  background: var(--accent);
  color: #07111F;
  border-color: var(--accent);
}

/* ===================== Details ===================== */
.crew-details {
  overflow: hidden;
}

.crew-details > * + * {
  margin-top: 20px;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

.details-bio .bio-title {
  margin: 0 0 10px;
  color: var(--accent);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-weight: 700;
}

.details-bio .bio-text {
  color: var(--text-soft);
  font-size: 0.96rem;
  line-height: 1.7;
  margin: 0;
}

.details-footer {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* ===================== Transitions ===================== */
.details-enter-active,
.details-leave-active {
  transition:
    max-height 0.45s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease,
    transform 0.35s ease;
  max-height: 800px;
  overflow: hidden;
}

.details-enter-from,
.details-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-8px);
}

.details-enter-to,
.details-leave-from {
  max-height: 800px;
  opacity: 1;
  transform: translateY(0);
}

/* ===================== Loading / Skeleton ===================== */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
}

.skeleton-card {
  height: 160px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border);
  background: linear-gradient(100deg, var(--surface) 30%, var(--surface-2) 50%, var(--surface) 70%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ===================== Error / footer ===================== */
.error-state {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}

.footer-error {
  margin-top: 18px;
  text-align: center;
}

/* ===================== Responsive ===================== */
@media (max-width: 820px) {
  .crew-page {
    padding: 24px 16px 48px;
  }

  .crew-hero {
    padding: 28px 20px;
  }

  .crew-grid,
  .skeleton-grid {
    grid-template-columns: 1fr;
  }

  .crew-card.is-expanded .avatar {
    width: 96px;
    height: 96px;
  }
}
</style>
