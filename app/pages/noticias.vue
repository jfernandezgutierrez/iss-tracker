<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

useHead({
  title: 'Noticias de la ISS y la NASA — Últimas novedades espaciales',
  meta: [
    {
      name: 'description',
      content: 'Últimas noticias sobre la Estación Espacial Internacional, misiones de la NASA, SpaceX, ESA y exploración espacial. Información actualizada sobre lanzamientos, astronautas y descubrimientos científicos.'
    },
    {
      name: 'keywords',
      content: 'noticias ISS, noticias NASA, noticias espacio, SpaceX noticias, ESA noticias, astronautas ISS, misiones espaciales, lanzamientos cohetes'
    },
    { property: 'og:title', content: 'Noticias de la ISS y la NASA — Últimas novedades espaciales' },
    {
      property: 'og:description',
      content: 'Las últimas noticias sobre la ISS, la NASA, SpaceX, ESA y la exploración espacial en un solo lugar.'
    },
    { property: 'og:url', content: 'https://isstrackerlive.es/noticias' }
  ],
  link: [
    { rel: 'canonical', href: 'https://isstrackerlive.es/noticias' }
  ]
})

// ── Tipos ────────────────────────────────────────────────────────────────────
interface Article {
  id: string
  title: string
  summary: string
  url: string
  imageUrl: string
  publishedAt: string
  site: string
  category: string
  featured: boolean
}

// ── Categorías ───────────────────────────────────────────────────────────────
const categories = [
  { id: 'all',         label: 'Todo',        icon: '🌌' },
  { id: 'iss',         label: 'ISS',         icon: '🛸' },
  { id: 'nasa',        label: 'NASA',        icon: '🚀' },
  { id: 'spacex',      label: 'SpaceX',      icon: '🐉' },
  { id: 'launches',    label: 'Lanzamientos',icon: '🔥' },
  { id: 'science',     label: 'Ciencia',     icon: '🔬' },
  { id: 'esa',         label: 'ESA / JAXA',  icon: '🇪🇺' },
]

// ── Estado ───────────────────────────────────────────────────────────────────
const articles = ref<Article[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const activeCategory = ref('all')
const page = ref(1)
const totalCount = ref(0)
const cache = ref<Record<string, Article[]>>({})

const PAGE_SIZE = 12

// Spaceflight News API — FOSS, sin clave, CORS abierto
const SNAPI = 'https://api.spaceflightnewsapi.net/v4/articles'

const CATEGORY_QUERIES: Record<string, string[]> = {
  all:      ['ISS', 'NASA', 'space station', 'astronaut'],
  iss:      ['ISS', 'International Space Station', 'space station'],
  nasa:     ['NASA', 'Artemis', 'astronaut'],
  spacex:   ['SpaceX', 'Falcon', 'Starship', 'Dragon'],
  launches: ['launch', 'rocket', 'liftoff', 'mission'],
  science:  ['microgravity', 'experiment', 'research', 'science orbit'],
  esa:      ['ESA', 'European Space Agency', 'JAXA'],
}

async function fetchArticles(reset = false) {
  if (reset) {
    page.value = 1
    articles.value = []
  }

  const cacheKey = `${activeCategory.value}_${page.value}`
  if (cache.value[cacheKey]) {
    if (reset) articles.value = cache.value[cacheKey]
    else articles.value = [...articles.value, ...cache.value[cacheKey]]
    return
  }

  loading.value = true
  error.value = null

  try {
    const queries = CATEGORY_QUERIES[activeCategory.value] || CATEGORY_QUERIES.all
    // Usamos el primer término de búsqueda de la categoría
    const searchTerm = queries[0]
    const offset = (page.value - 1) * PAGE_SIZE

    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(offset),
      search: searchTerm,
      ordering: '-published_at'
    })

    const data = await $fetch<any>(`${SNAPI}?${params}`)

    totalCount.value = data?.count || 0

    const mapped: Article[] = (data?.results || []).map((item: any, idx: number) => ({
      id: String(item.id),
      title: item.title || 'Sin título',
      summary: item.summary || '',
      url: item.url || '#',
      imageUrl: item.image_url || '',
      publishedAt: item.published_at || '',
      site: item.news_site || 'Fuente desconocida',
      category: activeCategory.value,
      featured: idx === 0 && page.value === 1
    }))

    cache.value[cacheKey] = mapped
    if (reset) articles.value = mapped
    else articles.value = [...articles.value, ...mapped]

  } catch (e: any) {
    error.value = 'No se pudo conectar con la fuente de noticias. Inténtalo de nuevo.'
  } finally {
    loading.value = false
  }
}

function selectCategory(id: string) {
  if (activeCategory.value === id) return
  activeCategory.value = id
  fetchArticles(true)
}

function loadMore() {
  page.value++
  fetchArticles(false)
}

const hasMore = computed(() => articles.value.length < totalCount.value)

const featuredArticle = computed(() =>
  articles.value.find(a => a.featured) || null
)

const regularArticles = computed(() =>
  articles.value.filter(a => !a.featured)
)

function formatDate(iso: string) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return iso.slice(0, 10)
  }
}

function timeAgo(iso: string) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (mins < 60) return `hace ${mins} min`
  if (hours < 24) return `hace ${hours} h`
  if (days < 30) return `hace ${days} días`
  return formatDate(iso)
}

onMounted(() => fetchArticles(true))
</script>

<template>
  <div class="noticias-page">

    <!-- ── Hero ── -->
    <header class="noticias-hero">
      <p class="eyebrow">Actualidad espacial</p>
      <h1 class="display-title">Noticias de la <span class="highlight">ISS y la NASA</span></h1>
      <p class="hero-text">
        Las últimas novedades sobre la Estación Espacial Internacional, misiones de la NASA,
        SpaceX, ESA y todo lo relacionado con la exploración humana del espacio.
      </p>
      <div v-if="totalCount > 0" class="hero-badges">
        <span class="status-pill">{{ totalCount.toLocaleString('es-ES') }} artículos disponibles</span>
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
        <span>{{ cat.icon }}</span>
        {{ cat.label }}
      </button>
    </div>

    <!-- ── Loading inicial ── -->
    <div v-if="loading && articles.length === 0" class="skeleton-container">
      <div class="skeleton-featured"></div>
      <div class="skeleton-grid">
        <div v-for="n in 6" :key="n" class="skeleton-card"></div>
      </div>
    </div>

    <!-- ── Error ── -->
    <div v-else-if="error && articles.length === 0" class="error-state">
      <div class="error-icon">⚠️</div>
      <h2 class="section-title">No se pudieron cargar las noticias</h2>
      <p class="error-text">{{ error }}</p>
      <button class="btn btn-primary" @click="fetchArticles(true)">Reintentar</button>
    </div>

    <!-- ── Contenido ── -->
    <div v-else class="news-content">

      <!-- Artículo destacado -->
      <a
        v-if="featuredArticle"
        :href="featuredArticle.url"
        target="_blank"
        rel="noopener noreferrer"
        class="featured-card"
      >
        <div class="featured-img-wrap">
          <img
            v-if="featuredArticle.imageUrl"
            :src="featuredArticle.imageUrl"
            :alt="featuredArticle.title"
            class="featured-img"
            loading="eager"
          />
          <div v-else class="featured-img-placeholder">🚀</div>
          <div class="featured-overlay">
            <div class="featured-badge">✨ Destacado</div>
            <h2 class="featured-title">{{ featuredArticle.title }}</h2>
            <p class="featured-summary">{{ featuredArticle.summary?.slice(0, 220) }}{{ featuredArticle.summary?.length > 220 ? '…' : '' }}</p>
            <div class="featured-meta">
              <span class="news-site">{{ featuredArticle.site }}</span>
              <span class="news-time">{{ timeAgo(featuredArticle.publishedAt) }}</span>
            </div>
          </div>
        </div>
      </a>

      <!-- Grid de artículos -->
      <div class="news-grid">
        <a
          v-for="article in regularArticles"
          :key="article.id"
          :href="article.url"
          target="_blank"
          rel="noopener noreferrer"
          class="news-card"
        >
          <div class="news-img-wrap">
            <img
              v-if="article.imageUrl"
              :src="article.imageUrl"
              :alt="article.title"
              class="news-img"
              loading="lazy"
              @error="($event.target as HTMLImageElement).style.display = 'none'"
            />
            <div v-else class="news-img-placeholder">🛸</div>
          </div>
          <div class="news-body">
            <h3 class="news-title">{{ article.title }}</h3>
            <p class="news-summary">{{ article.summary?.slice(0, 140) }}{{ article.summary?.length > 140 ? '…' : '' }}</p>
            <div class="news-footer">
              <span class="news-site">{{ article.site }}</span>
              <span class="news-time">{{ timeAgo(article.publishedAt) }}</span>
            </div>
          </div>
        </a>

        <!-- Skeletons al cargar más -->
        <template v-if="loading">
          <div v-for="n in 6" :key="`sk-${n}`" class="skeleton-card"></div>
        </template>
      </div>

      <!-- Cargar más -->
      <div v-if="hasMore && !loading" class="load-more-wrap">
        <button class="btn btn-primary btn-load-more" @click="loadMore">
          Cargar más noticias
        </button>
        <p class="load-more-note">{{ articles.length }} de {{ totalCount.toLocaleString('es-ES') }} artículos</p>
      </div>
    </div>

    <!-- ── Fuentes ── -->
    <div class="sources-footer">
      <p class="sources-text">
        Noticias proporcionadas por <a href="https://spaceflightnewsapi.net" target="_blank" rel="noopener noreferrer">Spaceflight News API</a> —
        fuentes incluyen Space.com, NASA.gov, SpaceNews, Ars Technica, NASASpaceFlight y otras.
      </p>
    </div>

  </div>
</template>

<style scoped>
.noticias-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px 80px;
  color: var(--text);
}

/* ── Hero ── */
.noticias-hero {
  border: 1px solid var(--border);
  border-radius: var(--radius-2xl);
  background: linear-gradient(135deg, #0B1220 0%, var(--surface) 50%, #0B1830 100%);
  padding: 48px 40px;
  margin-bottom: 32px;
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
}

.noticias-hero::after {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 480px;
  height: 480px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--glow) 0%, transparent 60%);
  pointer-events: none;
}

.display-title {
  margin: 0 0 14px;
  position: relative;
  z-index: 1;
}

.highlight { color: var(--accent); }

.hero-text {
  position: relative;
  z-index: 1;
  max-width: 600px;
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

/* ── Featured ── */
.featured-card {
  display: block;
  border-radius: var(--radius-2xl);
  overflow: hidden;
  margin-bottom: 24px;
  text-decoration: none;
  border: 1px solid var(--border);
  transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
}

.featured-card:hover {
  border-color: var(--accent);
  box-shadow: 0 20px 56px rgba(0,0,0,0.5), 0 0 32px var(--glow-accent);
  transform: translateY(-3px);
}

.featured-img-wrap {
  position: relative;
  aspect-ratio: 21 / 7;
  background: var(--surface-2);
  overflow: hidden;
}

@media (max-width: 820px) {
  .featured-img-wrap { aspect-ratio: 16 / 8; }
}

.featured-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
}

.featured-card:hover .featured-img {
  transform: scale(1.03);
}

.featured-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  background: var(--surface-2);
}

.featured-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(4,8,18,0.96) 0%, rgba(4,8,18,0.5) 50%, transparent 100%);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 28px 32px;
  gap: 8px;
}

.featured-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(110,242,216,0.2);
  border: 1px solid rgba(110,242,216,0.4);
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  width: fit-content;
}

.featured-title {
  font-size: clamp(1.2rem, 2.5vw, 1.8rem);
  font-weight: 800;
  color: var(--text);
  margin: 0;
  line-height: 1.2;
}

.featured-summary {
  font-size: 0.9rem;
  color: var(--text-soft);
  line-height: 1.55;
  margin: 0;
  max-width: 640px;
}

.featured-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

/* ── News grid ── */
.news-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 18px;
  margin-bottom: 36px;
}

.news-card {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  text-decoration: none;
  color: var(--text);
  transition: border-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
}

.news-card:hover {
  border-color: var(--primary);
  transform: translateY(-3px);
  box-shadow: 0 14px 36px rgba(0,0,0,0.4), 0 0 18px var(--glow);
}

.news-img-wrap {
  position: relative;
  aspect-ratio: 16 / 8;
  background: var(--surface-2);
  overflow: hidden;
}

.news-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.35s ease;
}

.news-card:hover .news-img {
  transform: scale(1.06);
}

.news-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.news-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.news-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-summary {
  font-size: 0.82rem;
  color: var(--text-soft);
  line-height: 1.55;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.news-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: auto;
}

.news-site {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.news-time {
  font-size: 0.72rem;
  color: var(--text-dim);
  white-space: nowrap;
}

/* ── Skeletons ── */
.skeleton-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skeleton-featured {
  height: 300px;
  border-radius: var(--radius-2xl);
  background: linear-gradient(100deg, var(--surface) 30%, var(--surface-2) 50%, var(--surface) 70%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 18px;
}

.skeleton-card {
  height: 260px;
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

/* ── Error ── */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 36px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
}

.error-icon { font-size: 2.5rem; }
.error-text { color: var(--text-soft); font-size: 0.9rem; margin: 0; }

/* ── Load more ── */
.load-more-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.btn-load-more { padding: 14px 40px; font-size: 1rem; }

.load-more-note {
  font-size: 0.82rem;
  color: var(--text-dim);
  margin: 0;
}

/* ── Botones ── */
.btn {
  display: inline-flex;
  align-items: center;
  padding: 10px 22px;
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
  box-shadow: 0 0 26px var(--glow-accent);
}

/* ── Sources footer ── */
.sources-footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid var(--border-soft);
}

.sources-text {
  font-size: 0.78rem;
  color: var(--text-dim);
  text-align: center;
  margin: 0;
}

.sources-text a {
  color: var(--primary);
}

/* ── Status pill ── */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--text-soft);
  font-size: 0.78rem;
  font-weight: 600;
  border: 1px solid var(--border);
}

/* ── Responsive ── */
@media (max-width: 820px) {
  .noticias-page {
    padding: 24px 16px 56px;
  }

  .noticias-hero {
    padding: 28px 20px;
  }

  .news-grid {
    grid-template-columns: 1fr;
  }

  .featured-overlay {
    padding: 20px;
  }
}
</style>
