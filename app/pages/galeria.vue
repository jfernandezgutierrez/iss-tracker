<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

useHead({
  title: 'Galería de fotos de la ISS — Imágenes de la NASA desde el espacio',
  meta: [
    {
      name: 'description',
      content: 'Explora cientos de imágenes espectaculares tomadas desde la Estación Espacial Internacional: la Tierra desde el espacio, auroras boreales, ciudades nocturnas, lanzamientos y misiones. Galería oficial de la NASA.'
    },
    {
      name: 'keywords',
      content: 'fotos ISS, imágenes ISS, galería NASA, fotos desde el espacio, tierra desde el espacio, auroras ISS, fotos astronautas, imágenes estación espacial'
    },
    { property: 'og:title', content: 'Galería de fotos de la ISS — Imágenes de la NASA desde el espacio' },
    {
      property: 'og:description',
      content: 'Cientos de imágenes espectaculares de la ISS y de la Tierra tomadas desde el espacio. Galería oficial de la NASA.'
    },
    { property: 'og:url', content: 'https://isstrackerlive.es/galeria' }
  ],
  link: [
    { rel: 'canonical', href: 'https://isstrackerlive.es/galeria' }
  ]
})

// ── Tipos ───────────────────────────────────────────────────────────────────
interface NasaImage {
  id: string
  title: string
  description: string
  date: string
  url: string
  thumb: string
  center: string
  keywords: string[]
}

// ── Categorías de búsqueda ───────────────────────────────────────────────────
const categories = [
  { id: 'all',        label: 'Todo',           icon: '🌌', query: 'ISS International Space Station' },
  { id: 'earth',      label: 'Tierra',         icon: '🌍', query: 'Earth from ISS orbit' },
  { id: 'aurora',     label: 'Auroras',        icon: '🌈', query: 'aurora borealis ISS space station' },
  { id: 'crew',       label: 'Tripulación',    icon: '👨‍🚀', query: 'ISS astronauts crew spacewalk' },
  { id: 'launch',     label: 'Lanzamientos',   icon: '🚀', query: 'rocket launch NASA SpaceX' },
  { id: 'earth-night', label: 'Ciudades',      icon: '🌃', query: 'city lights night Earth orbit' },
  { id: 'moon',       label: 'Luna',           icon: '🌙', query: 'moon from ISS space station orbit' },
  { id: 'spacewalk',  label: 'Paseo espacial', icon: '🧑‍🚀', query: 'EVA spacewalk extravehicular ISS' },
]

// ── Estado ───────────────────────────────────────────────────────────────────
const activeCategory = ref('all')
const images = ref<NasaImage[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const page = ref(1)
const totalResults = ref(0)
const selectedImage = ref<NasaImage | null>(null)

// Caché por categoría
const cache = ref<Record<string, NasaImage[]>>({})

const PAGE_SIZE = 24
const NASA_API = 'https://images-api.nasa.gov/search'

// ── Fetch ────────────────────────────────────────────────────────────────────
async function fetchImages(reset = false) {
  if (reset) {
    page.value = 1
    images.value = []
  }

  const cacheKey = `${activeCategory.value}_${page.value}`
  if (cache.value[cacheKey]) {
    if (reset) images.value = cache.value[cacheKey]
    else images.value = [...images.value, ...cache.value[cacheKey]]
    return
  }

  loading.value = true
  error.value = null

  try {
    const cat = categories.find(c => c.id === activeCategory.value) || categories[0]
    const params = new URLSearchParams({
      q: cat.query,
      media_type: 'image',
      page: String(page.value),
      page_size: String(PAGE_SIZE)
    })

    const data = await $fetch<any>(`${NASA_API}?${params}`)
    const items: NasaImage[] = (data?.collection?.items || [])
      .filter((item: any) => item?.links?.[0]?.href)
      .map((item: any) => {
        const d = item.data?.[0] || {}
        const thumb = item.links[0].href as string
        return {
          id: d.nasa_id || thumb,
          title: d.title || 'Sin título',
          description: d.description || '',
          date: d.date_created ? d.date_created.slice(0, 10) : '',
          url: thumb.replace('thumb', 'orig'),
          thumb,
          center: d.center || '',
          keywords: Array.isArray(d.keywords) ? d.keywords.slice(0, 4) : []
        }
      })

    totalResults.value = data?.collection?.metadata?.total_hits || 0
    cache.value[cacheKey] = items

    if (reset) {
      images.value = items
    } else {
      images.value = [...images.value, ...items]
    }
  } catch (e: any) {
    error.value = 'No se ha podido conectar con la API de imágenes de la NASA.'
  } finally {
    loading.value = false
  }
}

function selectCategory(id: string) {
  if (activeCategory.value === id) return
  activeCategory.value = id
  fetchImages(true)
}

function loadMore() {
  page.value++
  fetchImages(false)
}

function openModal(img: NasaImage) {
  selectedImage.value = img
  document.body.style.overflow = 'hidden'
}

function closeModal() {
  selectedImage.value = null
  document.body.style.overflow = ''
}

// Navegación del modal con teclado
function onKeydown(e: KeyboardEvent) {
  if (!selectedImage.value) return
  if (e.key === 'Escape') closeModal()
  if (e.key === 'ArrowRight') {
    const idx = images.value.findIndex(i => i.id === selectedImage.value!.id)
    if (idx < images.value.length - 1) selectedImage.value = images.value[idx + 1]
  }
  if (e.key === 'ArrowLeft') {
    const idx = images.value.findIndex(i => i.id === selectedImage.value!.id)
    if (idx > 0) selectedImage.value = images.value[idx - 1]
  }
}

function prevImage() {
  if (!selectedImage.value) return
  const idx = images.value.findIndex(i => i.id === selectedImage.value!.id)
  if (idx > 0) selectedImage.value = images.value[idx - 1]
}

function nextImage() {
  if (!selectedImage.value) return
  const idx = images.value.findIndex(i => i.id === selectedImage.value!.id)
  if (idx < images.value.length - 1) selectedImage.value = images.value[idx + 1]
}

const hasMore = computed(() => images.value.length < totalResults.value)

const formatDate = (d: string) => {
  if (!d) return ''
  const parts = d.split('-')
  if (parts.length !== 3) return d
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

const selectedIndex = computed(() =>
  images.value.findIndex(i => i.id === selectedImage.value?.id)
)

onMounted(() => {
  fetchImages(true)
  window.addEventListener('keydown', onKeydown)
})

import { onBeforeUnmount } from 'vue'
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="galeria-page">

    <!-- ── Hero ── -->
    <header class="galeria-hero">
      <p class="eyebrow">Galería oficial NASA</p>
      <h1 class="display-title">Imágenes de la <span class="highlight">ISS y el espacio</span></h1>
      <p class="hero-text">
        Explora imágenes espectaculares tomadas desde la Estación Espacial Internacional y la
        biblioteca oficial de la NASA. Desde auroras boreales hasta ciudades iluminadas de noche,
        pasando por paseos espaciales y lanzamientos históricos.
      </p>
      <div v-if="totalResults > 0" class="hero-badges">
        <span class="status-pill">{{ totalResults.toLocaleString('es-ES') }} imágenes disponibles</span>
        <span class="status-pill">{{ images.length }} cargadas</span>
      </div>
    </header>

    <!-- ── Filtros ── -->
    <div class="filters-bar">
      <button
        v-for="cat in categories"
        :key="cat.id"
        :class="['filter-btn', { 'is-active': activeCategory === cat.id }]"
        @click="selectCategory(cat.id)"
      >
        <span class="filter-icon">{{ cat.icon }}</span>
        {{ cat.label }}
      </button>
    </div>

    <!-- ── Skeleton loading ── -->
    <div v-if="loading && images.length === 0" class="gallery-grid">
      <div v-for="n in 24" :key="n" class="skeleton-card"></div>
    </div>

    <!-- ── Error ── -->
    <div v-else-if="error && images.length === 0" class="error-state panel-card">
      <div class="error-icon">⚠️</div>
      <h2 class="section-title">No se pudieron cargar las imágenes</h2>
      <p class="section-subtitle">{{ error }}</p>
      <button class="btn btn-primary" @click="fetchImages(true)">Reintentar</button>
    </div>

    <!-- ── Galería ── -->
    <div v-else class="gallery-grid">
      <div
        v-for="img in images"
        :key="img.id"
        class="gallery-card"
        @click="openModal(img)"
        :title="img.title"
      >
        <div class="gallery-img-wrapper">
          <img
            :src="img.thumb"
            :alt="img.title"
            class="gallery-img"
            loading="lazy"
            @error="($event.target as HTMLImageElement).style.display='none'"
          />
          <div class="gallery-overlay">
            <svg class="zoom-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="11" y1="8" x2="11" y2="14"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </div>
        </div>
        <div class="gallery-info">
          <p class="gallery-title">{{ img.title }}</p>
          <div class="gallery-meta">
            <span v-if="img.date" class="gallery-date">{{ formatDate(img.date) }}</span>
            <span v-if="img.center" class="gallery-center">{{ img.center }}</span>
          </div>
        </div>
      </div>

      <!-- Skeletons adicionales mientras carga más -->
      <template v-if="loading">
        <div v-for="n in 8" :key="`more-${n}`" class="skeleton-card"></div>
      </template>
    </div>

    <!-- ── Cargar más ── -->
    <div v-if="hasMore && !loading && images.length > 0" class="load-more-wrap">
      <button class="btn btn-primary btn-load-more" @click="loadMore">
        Cargar más imágenes
      </button>
      <p class="load-more-note">{{ images.length }} de {{ totalResults.toLocaleString('es-ES') }} imágenes</p>
    </div>

    <!-- ── Modal ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="selectedImage" class="modal-backdrop" @click.self="closeModal">
          <div class="modal-content">
            <!-- Cerrar -->
            <button class="modal-close" @click="closeModal" aria-label="Cerrar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="22" height="22">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            <!-- Navegación anterior -->
            <button
              v-if="selectedIndex > 0"
              class="modal-nav modal-nav-prev"
              @click="prevImage"
              aria-label="Anterior"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="22" height="22">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>

            <!-- Imagen -->
            <div class="modal-img-wrap">
              <img
                :src="selectedImage.url"
                :alt="selectedImage.title"
                class="modal-img"
                @error="($event.target as HTMLImageElement).src = selectedImage!.thumb"
              />
            </div>

            <!-- Navegación siguiente -->
            <button
              v-if="selectedIndex < images.length - 1"
              class="modal-nav modal-nav-next"
              @click="nextImage"
              aria-label="Siguiente"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="22" height="22">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>

            <!-- Info -->
            <div class="modal-info">
              <h2 class="modal-title">{{ selectedImage.title }}</h2>
              <div class="modal-meta">
                <span v-if="selectedImage.date" class="chip">📅 {{ formatDate(selectedImage.date) }}</span>
                <span v-if="selectedImage.center" class="chip">🏛️ {{ selectedImage.center }}</span>
              </div>
              <p v-if="selectedImage.description" class="modal-desc">
                {{ selectedImage.description.slice(0, 320) }}{{ selectedImage.description.length > 320 ? '…' : '' }}
              </p>
              <div v-if="selectedImage.keywords.length" class="modal-keywords">
                <span v-for="kw in selectedImage.keywords" :key="kw" class="chip chip-kw">{{ kw }}</span>
              </div>
              <div class="modal-actions">
                <a
                  :href="selectedImage.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-primary"
                >
                  Ver original
                </a>
                <button class="btn btn-ghost" @click="closeModal">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
.galeria-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 24px 80px;
  color: var(--text);
}

/* ── Hero ── */
.galeria-hero {
  border: 1px solid var(--border);
  border-radius: var(--radius-2xl);
  background: linear-gradient(135deg, #0B1220 0%, var(--surface) 50%, #0B1830 100%);
  padding: 48px 40px;
  margin-bottom: 32px;
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
}

.galeria-hero::after {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--glow) 0%, transparent 60%);
  pointer-events: none;
}

.display-title {
  margin: 0 0 14px;
  position: relative;
  z-index: 1;
}

.highlight {
  color: var(--accent);
}

.hero-text {
  position: relative;
  z-index: 1;
  max-width: 640px;
  color: var(--text-soft);
  font-size: 1.05rem;
  line-height: 1.7;
  margin: 0 0 20px;
}

.hero-badges {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

/* ── Filtros ── */
.filters-bar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 28px;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  border-radius: 999px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text-soft);
  font-size: 0.87rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  background: var(--surface-3);
  color: var(--text);
  border-color: var(--primary);
}

.filter-btn.is-active {
  background: var(--primary);
  color: #07111F;
  border-color: var(--primary-strong);
  box-shadow: 0 0 16px var(--glow);
}

.filter-icon {
  font-size: 1rem;
}

/* ── Gallery grid ── */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 36px;
}

.gallery-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
}

.gallery-card:hover {
  border-color: var(--primary);
  transform: translateY(-4px);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.5), 0 0 24px var(--glow);
}

.gallery-img-wrapper {
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--surface-2);
}

.gallery-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
}

.gallery-card:hover .gallery-img {
  transform: scale(1.06);
}

.gallery-overlay {
  position: absolute;
  inset: 0;
  background: rgba(7, 17, 31, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.25s ease;
  backdrop-filter: blur(2px);
}

.gallery-card:hover .gallery-overlay {
  opacity: 1;
}

.zoom-icon {
  color: #fff;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.5));
}

.gallery-info {
  padding: 12px 14px;
}

.gallery-title {
  font-size: 0.87rem;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gallery-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.gallery-date,
.gallery-center {
  font-size: 0.75rem;
  color: var(--text-dim);
  font-weight: 500;
}

/* ── Skeleton ── */
.skeleton-card {
  border-radius: var(--radius-xl);
  aspect-ratio: 16 / 10;
  border: 1px solid var(--border);
  background: linear-gradient(100deg, var(--surface) 30%, var(--surface-2) 50%, var(--surface) 70%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Error ── */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 32px;
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  background: var(--surface);
}

.error-icon {
  font-size: 2.5rem;
}

/* ── Load more ── */
.load-more-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.btn-load-more {
  padding: 14px 36px;
  font-size: 1rem;
}

.load-more-note {
  font-size: 0.85rem;
  color: var(--text-dim);
  margin: 0;
}

/* ── Buttons ── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  text-decoration: none;
}

.btn-primary {
  background: var(--primary);
  color: #07111F;
  box-shadow: 0 0 18px var(--glow);
}

.btn-primary:hover {
  background: var(--accent);
  box-shadow: 0 0 24px var(--glow-accent);
}

.btn-ghost {
  background: var(--surface-2);
  color: var(--text-soft);
  border: 1px solid var(--border);
}

.btn-ghost:hover {
  background: var(--surface-3);
  color: var(--text);
}

/* ── Chips ── */
.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--text-soft);
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid var(--border);
}

.chip-kw {
  font-size: 0.72rem;
}

/* ── Modal ── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(4, 8, 18, 0.92);
  backdrop-filter: blur(6px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow-y: auto;
}

.modal-content {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-2xl);
  width: 100%;
  max-width: 960px;
  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.7);
  overflow: hidden;
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
}

.modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 10;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(16, 24, 38, 0.85);
  border: 1px solid var(--border);
  color: var(--text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.modal-close:hover {
  background: var(--danger);
  border-color: var(--danger);
}

.modal-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(16, 24, 38, 0.85);
  border: 1px solid var(--border);
  color: var(--text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.modal-nav:hover {
  background: var(--primary);
  border-color: var(--primary);
  color: #07111F;
}

.modal-nav-prev { left: 12px; }
.modal-nav-next { right: 12px; }

.modal-img-wrap {
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: 60vh;
  overflow: hidden;
}

.modal-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  max-height: 60vh;
}

.modal-info {
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  line-height: 1.3;
}

.modal-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.modal-desc {
  font-size: 0.88rem;
  color: var(--text-soft);
  line-height: 1.65;
  margin: 0;
}

.modal-keywords {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.modal-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 4px;
}

/* ── Modal transition ── */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.93) translateY(20px);
  opacity: 0;
}

/* ── Responsive ── */
@media (max-width: 820px) {
  .galeria-page {
    padding: 24px 16px 56px;
  }

  .galeria-hero {
    padding: 28px 20px;
  }

  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }

  .modal-nav-prev { left: 6px; }
  .modal-nav-next { right: 6px; }

  .modal-info {
    padding: 18px 20px;
  }
}
</style>
