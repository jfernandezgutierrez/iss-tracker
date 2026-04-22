<template>
  <section class="design-system-page">
    <div class="design-system-container">
      <header class="hero-card">
        <div class="hero-content">
          <div class="hero-copy">
            <p class="eyebrow">ISS Tracker</p>
            <h1 class="display-title">Paleta y sistema visual</h1>
            <p class="hero-text">
              Sistema visual para una web espacial, técnica y monetizable. La idea es que cualquier
              componente nuevo mantenga una jerarquía clara, contraste alto y una identidad coherente.
            </p>
          </div>

          <div class="hero-actions">
            <button class="btn btn-primary">Ver ISS ahora</button>
            <button class="btn btn-secondary">Próximo paso</button>
          </div>
        </div>
      </header>

      <section class="main-grid">
        <article class="panel-card map-preview-card">
          <div class="panel-header">
            <div>
              <h2 class="section-title">Vista principal</h2>
              <p class="section-subtitle">Mapa oscuro + overlays suaves + datos de alto contraste</p>
            </div>
            <span class="badge badge-live">Realtime</span>
          </div>

          <div class="map-preview">
            <div class="map-grid"></div>
            <div class="orbit-line"></div>
            <div class="iss-dot"></div>

            <div class="iss-tooltip glass-card">
              <div class="metric-label">ISS</div>
              <div class="tooltip-title">Sobre el Atlántico Norte</div>
              <div class="tooltip-status">Visible in 08:42</div>
            </div>

            <div class="metrics-grid">
              <div v-for="metric in metrics" :key="metric.label" class="metric-card glass-card">
                <div class="metric-label">{{ metric.label }}</div>
                <div class="metric-value">{{ metric.value }}</div>
              </div>
            </div>
          </div>
        </article>

        <aside class="sidebar-stack">
          <article class="panel-card">
            <h2 class="section-title">Paleta principal</h2>
            <p class="section-subtitle">
              Oscura para fondo, azul para navegación y acciones, turquesa para señal visual viva y datos orbitales.
            </p>

            <div class="palette-grid">
              <div v-for="color in paletteCards" :key="color.name" class="palette-card">
                <div class="palette-swatch" :style="{ background: color.value }"></div>
                <div class="palette-meta">
                  <div class="palette-name">{{ color.name }}</div>
                  <div class="palette-value">{{ color.value }}</div>
                </div>
              </div>
            </div>
          </article>

          <article class="panel-card">
            <h2 class="section-title">Componentes base</h2>

            <div class="chip-row">
              <span v-for="chip in chips" :key="chip.label" class="chip" :style="{
                color: chip.color,
                background: `${chip.color}20`
              }">
                {{ chip.label }}
              </span>
            </div>

            <div class="component-demo-stack">
              <button class="btn btn-primary btn-block">Botón principal</button>
              <button class="btn btn-secondary btn-block">Botón secundario</button>
              <div class="input-demo">Input / caja de búsqueda</div>
            </div>
          </article>
        </aside>
      </section>

      <section class="content-grid">
        <article class="panel-card astronaut-wrapper">
          <h2 class="section-title">Tarjeta de astronauta</h2>

          <div class="astronaut-card">
            <div class="astronaut-avatar">👨‍🚀</div>

            <div class="astronaut-content">
              <div class="astronaut-heading-row">
                <h3 class="card-title">Astronauta activo</h3>
                <span class="badge badge-success">On mission</span>
              </div>

              <p class="body-text-muted">
                Biografía corta, nacionalidad, misión actual e investigación destacada.
              </p>

              <div class="astronaut-stats-grid">
                <div class="mini-info-card">
                  <div class="mini-info-label">País</div>
                  <div class="mini-info-value">USA</div>
                </div>
                <div class="mini-info-card">
                  <div class="mini-info-label">Misión</div>
                  <div class="mini-info-value">Expedition</div>
                </div>
                <div class="mini-info-card">
                  <div class="mini-info-label">Proyecto</div>
                  <div class="mini-info-value">Microgravity</div>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article class="panel-card blog-card">
          <h2 class="section-title">Blog / SEO</h2>

          <div class="article-list">
            <article v-for="article in articles" :key="article" class="article-item">
              <div class="article-tag">Article</div>
              <h3 class="article-title">{{ article }}</h3>
              <p class="article-text">
                Bloque pensado para CTR, lectura cómoda y espacio compatible con AdSense.
              </p>
            </article>
          </div>
        </article>
      </section>

      <section class="panel-card tokens-card">
        <h2 class="section-title">Tokens CSS sugeridos</h2>
        <pre class="tokens-code">:root {
  --bg: #070B14;
  --surface: #101826;
  --surface-2: #182335;
  --surface-3: #0B1220;
  --border: #26344D;
  --text: #EAF2FF;
  --text-soft: #9FB1CC;
  --primary: #4DA3FF;
  --primary-strong: #1D7EF2;
  --accent: #6EF2D8;
  --success: #38D39F;
  --warning: #FFC857;
  --danger: #FF6B6B;
  --glow: rgba(77, 163, 255, 0.35);
}</pre>
      </section>
    </div>
  </section>
</template>

<script setup>
const paletteCards = [
  { name: 'Background', value: '#070B14' },
  { name: 'Surface', value: '#101826' },
  { name: 'Surface 2', value: '#182335' },
  { name: 'Surface 3', value: '#0B1220' },
  { name: 'Border', value: '#26344D' },
  { name: 'Text', value: '#EAF2FF' },
  { name: 'Text Soft', value: '#9FB1CC' },
  { name: 'Primary', value: '#4DA3FF' },
  { name: 'Primary Strong', value: '#1D7EF2' },
  { name: 'Accent', value: '#6EF2D8' },
  { name: 'Warning', value: '#FFC857' },
  { name: 'Danger', value: '#FF6B6B' },
  { name: 'Success', value: '#38D39F' }
]

const chips = [
  { label: 'Primary', color: '#4DA3FF' },
  { label: 'Accent', color: '#6EF2D8' },
  { label: 'Warning', color: '#FFC857' },
  { label: 'Danger', color: '#FF6B6B' },
  { label: 'Success', color: '#38D39F' }
]

const metrics = [
  { label: 'Velocidad', value: '27,600 km/h' },
  { label: 'Altitud', value: '408 km' },
  { label: 'Latitud', value: '43.46°' },
  { label: 'Longitud', value: '-3.80°' }
]

const articles = [
  'How to see the ISS tonight',
  'Active experiments aboard the ISS',
  'When will the ISS pass over my city?'
]
</script>

<style scoped>
:global(:root) {
  --bg: #070B14;
  --surface: #101826;
  --surface-2: #182335;
  --surface-3: #0B1220;
  --border: #26344D;
  --text: #EAF2FF;
  --text-soft: #9FB1CC;
  --primary: #4DA3FF;
  --primary-strong: #1D7EF2;
  --accent: #6EF2D8;
  --success: #38D39F;
  --warning: #FFC857;
  --danger: #FF6B6B;
  --glow: rgba(77, 163, 255, 0.35);
}

* {
  box-sizing: border-box;
}

.design-system-page {
  min-height: 100vh;
  padding: 32px;
  background:
    radial-gradient(circle at top left, rgba(77, 163, 255, 0.08), transparent 24%),
    radial-gradient(circle at top right, rgba(110, 242, 216, 0.06), transparent 20%),
    var(--bg);
  color: var(--text);
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.design-system-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.hero-card,
.panel-card {
  border: 1px solid var(--border);
  border-radius: 28px;
  background: var(--surface);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
}

.hero-card {
  padding: 32px;
  background: linear-gradient(135deg, #0B1220 0%, #101826 55%, #0B1830 100%);
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
}

.hero-copy {
  max-width: 850px;
}

.eyebrow {
  margin: 0 0 12px;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.28em;
  font-size: 0.78rem;
  font-weight: 700;
}

.display-title {
  margin: 0;
  font-size: clamp(2.2rem, 5vw, 3.4rem);
  line-height: 1.08;
  font-weight: 700;
}

.hero-text,
.section-subtitle,
.body-text-muted,
.article-text,
.palette-value,
.metric-label,
.mini-info-label,
.tokens-code,
.input-demo {
  color: var(--text-soft);
}

.hero-text {
  margin: 16px 0 0;
  max-width: 760px;
  font-size: 1.05rem;
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  border: none;
  cursor: pointer;
  border-radius: 18px;
  padding: 14px 22px;
  font-size: 0.98rem;
  font-weight: 700;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn-primary {
  background: var(--primary);
  color: #07111F;
  box-shadow: 0 0 30px var(--glow);
}

.btn-primary:hover {
  background: var(--primary-strong);
}

.btn-secondary {
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
}

.btn-block {
  width: 100%;
}

.main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  gap: 32px;
}

.sidebar-stack,
.component-demo-stack,
.article-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.panel-card {
  padding: 24px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 18px;
}

.section-title {
  margin: 0;
  font-size: 1.35rem;
  line-height: 1.2;
  font-weight: 700;
}

.section-subtitle {
  margin: 8px 0 0;
  font-size: 0.96rem;
  line-height: 1.6;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
}

.badge-live {
  background: var(--surface-2);
  color: var(--accent);
}

.badge-success {
  background: rgba(56, 211, 159, 0.12);
  color: var(--success);
}

.map-preview {
  position: relative;
  min-height: 420px;
  overflow: hidden;
  border-radius: 24px;
  background:
    radial-gradient(circle at 30% 20%, rgba(77, 163, 255, 0.12), transparent 22%),
    radial-gradient(circle at 78% 30%, rgba(110, 242, 216, 0.10), transparent 18%),
    linear-gradient(180deg, #08101D 0%, #0D1522 100%);
}

.map-grid {
  position: absolute;
  inset: 0;
  opacity: 0.25;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 36px 36px;
}

.orbit-line {
  position: absolute;
  top: 18%;
  left: 10%;
  width: 78%;
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(to right, transparent, var(--primary), transparent);
  opacity: 0.72;
}

.iss-dot {
  position: absolute;
  top: 16%;
  left: 62%;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 35px rgba(110, 242, 216, 0.75);
}

.iss-tooltip {
  position: absolute;
  top: 10%;
  left: 57%;
  min-width: 240px;
}

.glass-card {
  border: 1px solid var(--border);
  border-radius: 20px;
  background: rgba(11, 18, 32, 0.82);
  backdrop-filter: blur(10px);
  padding: 16px;
}

.tooltip-title,
.metric-value,
.card-title,
.article-title,
.mini-info-value,
.palette-name {
  color: var(--text);
}

.tooltip-title {
  margin-top: 6px;
  font-size: 1.05rem;
  font-weight: 700;
}

.tooltip-status {
  margin-top: 6px;
  color: var(--accent);
  font-size: 0.95rem;
  font-weight: 600;
}

.metrics-grid {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 16px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.metric-label {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.73rem;
  font-weight: 700;
}

.metric-value {
  margin-top: 10px;
  font-size: 1.1rem;
  line-height: 1.2;
  font-weight: 700;
}

.palette-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.palette-card {
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid var(--border);
  background: var(--surface-3);
}

.palette-swatch {
  height: 64px;
}

.palette-meta {
  padding: 14px;
}

.palette-name {
  font-size: 0.95rem;
  font-weight: 700;
}

.palette-value {
  margin-top: 4px;
  font-size: 0.86rem;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.chip {
  display: inline-flex;
  align-items: center;
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid var(--border);
  font-size: 0.9rem;
  font-weight: 700;
}

.input-demo {
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface-3);
  padding: 14px 16px;
  font-size: 0.95rem;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
  gap: 24px;
}

.astronaut-card {
  margin-top: 20px;
  display: flex;
  gap: 20px;
  align-items: flex-start;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: var(--surface-3);
}

.astronaut-avatar {
  width: 96px;
  height: 96px;
  flex: 0 0 96px;
  border-radius: 24px;
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  background: linear-gradient(135deg, #182335, #243754);
}

.astronaut-content {
  flex: 1;
}

.astronaut-heading-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.card-title {
  margin: 0;
  font-size: 1.6rem;
  line-height: 1.2;
  font-weight: 700;
}

.body-text-muted {
  margin: 12px 0 0;
  font-size: 0.98rem;
  line-height: 1.7;
}

.astronaut-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.mini-info-card {
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface);
  padding: 14px;
}

.mini-info-label {
  text-transform: uppercase;
  font-size: 0.74rem;
  letter-spacing: 0.12em;
  font-weight: 700;
}

.mini-info-value {
  margin-top: 6px;
  font-size: 0.98rem;
  font-weight: 700;
}

.article-item {
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface-3);
  padding: 16px;
  transition: background 0.2s ease, transform 0.2s ease;
}

.article-item:hover {
  background: var(--surface);
  transform: translateY(-1px);
}

.article-tag {
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.72rem;
  font-weight: 700;
}

.article-title {
  margin: 10px 0 0;
  font-size: 1rem;
  line-height: 1.45;
  font-weight: 700;
}

.article-text {
  margin: 10px 0 0;
  font-size: 0.92rem;
  line-height: 1.6;
}

.tokens-code {
  margin: 20px 0 0;
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--surface-3);
  padding: 20px;
  font-size: 0.92rem;
  line-height: 1.65;
}

@media (max-width: 1100px) {

  .main-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .hero-content {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 820px) {
  .design-system-page {
    padding: 16px;
  }

  .hero-card,
  .panel-card {
    padding: 18px;
    border-radius: 22px;
  }

  .metrics-grid,
  .astronaut-stats-grid,
  .palette-grid {
    grid-template-columns: 1fr 1fr;
  }

  .astronaut-card {
    flex-direction: column;
  }

  .iss-tooltip {
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 32px);
    min-width: auto;
  }
}

@media (max-width: 560px) {

  .metrics-grid,
  .astronaut-stats-grid,
  .palette-grid {
    grid-template-columns: 1fr;
  }

  .map-preview {
    min-height: 520px;
  }
}
</style>