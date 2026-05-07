<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useIss } from '../composables/useIss'

useHead({
  title: 'Historia y Estadísticas de la ISS — Datos en tiempo real y grandes hitos',
  meta: [
    {
      name: 'description',
      content: 'Descubre la historia completa de la Estación Espacial Internacional: línea de tiempo con todos los hitos desde 1998 hasta hoy, y estadísticas en tiempo real como velocidad, altitud, órbitas completadas y distancia recorrida.'
    },
    {
      name: 'keywords',
      content: 'historia ISS, estadísticas ISS, datos ISS, hitos Estación Espacial Internacional, órbitas ISS, velocidad ISS, altitud ISS, cuándo se lanzó la ISS, curiosidades ISS'
    },
    { property: 'og:title', content: 'Historia y Estadísticas de la ISS — Datos en tiempo real y grandes hitos' },
    {
      property: 'og:description',
      content: 'Línea de tiempo histórica de la ISS y estadísticas en vivo: velocidad, altitud, órbitas, distancia recorrida y mucho más.'
    },
    { property: 'og:url', content: 'https://isstrackerlive.es/historia' }
  ],
  link: [
    { rel: 'canonical', href: 'https://isstrackerlive.es/historia' }
  ]
})

// ── Posición en tiempo real ──────────────────────────────────────────────────
const { position, loadingPosition, loadPosition, startPositionPolling, stopPositionPolling } = useIss()

// ── Estadísticas calculadas ──────────────────────────────────────────────────
// La ISS se lanzó el 20 de noviembre de 1998 (módulo Zarya)
const LAUNCH_DATE = new Date('1998-11-20T06:40:00Z')
// Primera tripulación permanente: 2 de noviembre de 2000
const CREW_DATE = new Date('2000-11-02T09:21:00Z')

// Período orbital medio ≈ 92.65 minutos
const ORBITAL_PERIOD_MIN = 92.65
// Velocidad media ≈ 27,600 km/h
const AVG_VELOCITY_KMH = 27_600
// Distancia media recorrida por día
const KM_PER_DAY = AVG_VELOCITY_KMH * 24

const now = ref(Date.now())
let clockInterval: ReturnType<typeof setInterval> | null = null

const daysSinceLaunch = computed(() => {
  return Math.floor((now.value - LAUNCH_DATE.getTime()) / (1000 * 60 * 60 * 24))
})

const yearsSinceLaunch = computed(() => {
  return (daysSinceLaunch.value / 365.25).toFixed(1)
})

const daysCrewed = computed(() => {
  return Math.floor((now.value - CREW_DATE.getTime()) / (1000 * 60 * 60 * 24))
})

const orbitsCompleted = computed(() => {
  const minutesSinceLaunch = (now.value - LAUNCH_DATE.getTime()) / 60_000
  return Math.floor(minutesSinceLaunch / ORBITAL_PERIOD_MIN)
})

const kmTraveled = computed(() => {
  return Math.floor(daysSinceLaunch.value * KM_PER_DAY)
})

const lightYearsTraveled = computed(() => {
  // 1 año luz = 9.461e12 km
  return (kmTraveled.value / 9.461e12).toFixed(6)
})

const currentVelocity = computed(() => {
  if (position.value?.velocity) {
    return Math.round(position.value.velocity).toLocaleString('es-ES')
  }
  return '27.600'
})

const currentAltitude = computed(() => {
  if (position.value?.altitude) {
    return Math.round(position.value.altitude).toLocaleString('es-ES')
  }
  return '408'
})

// Órbitas en el día actual
const orbitsToday = computed(() => {
  const startOfDay = new Date()
  startOfDay.setUTCHours(0, 0, 0, 0)
  const minutesToday = (now.value - startOfDay.getTime()) / 60_000
  return Math.floor(minutesToday / ORBITAL_PERIOD_MIN)
})

// Distancia recorrida hoy
const kmToday = computed(() => {
  const startOfDay = new Date()
  startOfDay.setUTCHours(0, 0, 0, 0)
  const hoursToday = (now.value - startOfDay.getTime()) / 3_600_000
  return Math.floor(hoursToday * AVG_VELOCITY_KMH).toLocaleString('es-ES')
})

// Número aproximado de experimentos realizados en la ISS
const EXPERIMENTS_TOTAL = 3_000

// Número aproximado de personas que han visitado la ISS
const VISITORS_TOTAL = 280

// Número de países que han contribuido a la ISS
const COUNTRIES_TOTAL = 15

// ── Hitos históricos ─────────────────────────────────────────────────────────
const milestones = [
  {
    year: '1984',
    title: 'El origen: Estación Freedom',
    icon: '🌟',
    color: 'var(--text-dim)',
    text: 'El presidente Ronald Reagan encarga a la NASA el diseño de una estación espacial internacional. Nace el proyecto Freedom, precursor directo de la ISS.'
  },
  {
    year: '1993',
    title: 'EE.UU. y Rusia unen fuerzas',
    icon: '🤝',
    color: 'var(--primary)',
    text: 'Clinton y Yeltsin acuerdan fusionar el programa Freedom con la estación rusa Mir-2. Se forma el consorcio de 15 naciones que construirá la ISS.'
  },
  {
    year: '20 Nov 1998',
    title: 'Lanzamiento del módulo Zarya',
    icon: '🚀',
    color: 'var(--accent)',
    text: 'Rusia lanza desde Baikonur el módulo Zarya (FGB), el primer componente de la ISS. Pesa 20.000 kg y proporciona energía y propulsión inicial a la estación.'
  },
  {
    year: '4 Dic 1998',
    title: 'Unity se une a Zarya',
    icon: '🔗',
    color: 'var(--primary)',
    text: 'El transbordador Endeavour lleva el módulo Unity (Node 1) y lo acopla a Zarya. Primera conexión entre segmentos americano y ruso de la estación.'
  },
  {
    year: '2 Nov 2000',
    title: 'Primera tripulación permanente',
    icon: '👨‍🚀',
    color: 'var(--success)',
    text: 'Expedición 1 llega a bordo: Bill Shepherd (NASA) y Yuri Gidzenko y Sergei Krikalev (Roscosmos). Comienza la presencia humana ininterrumpida en la ISS, que se mantiene hasta hoy.'
  },
  {
    year: '7 Feb 2001',
    title: 'Laboratorio Destiny',
    icon: '🔬',
    color: 'var(--accent)',
    text: 'Se instala el módulo laboratorio Destiny, el principal laboratorio científico norteamericano. Con 8,5 metros de longitud, alberga 24 equipos de investigación.'
  },
  {
    year: '2001',
    title: 'Primer turista espacial',
    icon: '💰',
    color: 'var(--warning)',
    text: 'Dennis Tito se convierte en el primer turista espacial de la historia, pagando 20 millones de dólares para pasar 8 días en la ISS. La visita genera gran controversia en la NASA.'
  },
  {
    year: '2001–2009',
    title: 'Expansión modular',
    icon: '🏗️',
    color: 'var(--primary)',
    text: 'Años de construcción intensa: se añaden los módulos Quest, Pirs, Harmony, Columbus (ESA), Kibo (JAXA) y el brazo robótico Canadarm2. La estación multiplica su tamaño.'
  },
  {
    year: '2008',
    title: 'Módulo Columbus de la ESA',
    icon: '🇪🇺',
    color: 'var(--primary)',
    text: 'La Agencia Espacial Europea entrega su laboratorio Columbus, el mayor módulo europeo. Realiza experimentos en biología, física de fluidos, ciencias de materiales y ciencias de la Tierra.'
  },
  {
    year: '2009',
    title: 'Ampliación a 6 tripulantes',
    icon: '👥',
    color: 'var(--success)',
    text: 'La capacidad de la ISS se amplía de 3 a 6 tripulantes permanentes con la llegada de la Expedición 20, gracias a la incorporación de los nuevos módulos de vida.'
  },
  {
    year: '2011',
    title: 'Fin del programa Shuttle',
    icon: '🛸',
    color: 'var(--warning)',
    text: 'El transbordador Atlantis completa el vuelo STS-135, el último del programa Space Shuttle. Durante 30 años realizó 135 misiones. La Soyuz rusa queda como único transporte tripulado.'
  },
  {
    year: '2012',
    title: 'Dragon de SpaceX atraca por primera vez',
    icon: '🐉',
    color: 'var(--accent)',
    text: 'La nave Dragon de SpaceX se convierte en la primera nave comercial en atracar en la ISS, iniciando una nueva era de colaboración público-privada en el transporte espacial.'
  },
  {
    year: '2015',
    title: 'Récord de permanencia de Scott Kelly',
    icon: '⏱️',
    color: 'var(--primary)',
    text: 'Scott Kelly y Mikhail Kornienko inician una misión de un año en la ISS para estudiar los efectos del espacio prolongado en el cuerpo humano. Kelly regresa con datos cruciales sobre salud en misiones largas.'
  },
  {
    year: '2020',
    title: 'Crew Dragon lleva astronautas a la ISS',
    icon: '🔄',
    color: 'var(--accent)',
    text: 'SpaceX Crew Dragon realiza su primer vuelo operacional (Crew-1), restableciendo la capacidad de EE.UU. de lanzar astronautas desde suelo americano tras 9 años de dependencia rusa.'
  },
  {
    year: '2021',
    title: 'Módulo Nauka — incidente de propulsores',
    icon: '⚠️',
    color: 'var(--danger)',
    text: 'El módulo ruso Nauka se acopla a la ISS pero sus propulsores se activan accidentalmente, rotando la estación 45 grados. La tripulación recupera el control manualmente en 47 minutos.'
  },
  {
    year: '2022',
    title: 'Rusia anuncia su retirada en 2024',
    icon: '🏳️',
    color: 'var(--warning)',
    text: 'Roscosmos anuncia que dejará la ISS después de 2024 para construir su propia estación. Sin embargo, la colaboración se mantiene mientras negociaciones continúan.'
  },
  {
    year: '2024',
    title: 'Problemas en la Soyuz MS-22',
    icon: '🛠️',
    color: 'var(--danger)',
    text: 'Un meteorito daña el sistema de refrigeración de la Soyuz MS-22. La nave regresa a Tierra sin tripulación. Se envía una Soyuz de rescate, prolongando la estancia de tres astronautas.'
  },
  {
    year: '2030',
    title: 'Desorbita prevista',
    icon: '🌊',
    color: 'var(--text-dim)',
    text: 'Según los planes actuales de la NASA y sus socios, la ISS será desorbita de forma controlada alrededor de 2030. Los fragmentos que sobrevivan la reentrada caerán en el océano Pacífico.'
  }
]

// ── Curiosidades ─────────────────────────────────────────────────────────────
const facts = [
  { icon: '🏠', label: 'Tamaño', value: 'Como un campo de fútbol', sub: '109 × 73 metros' },
  { icon: '⚖️', label: 'Masa', value: '420.000 kg', sub: 'El objeto más pesado en órbita' },
  { icon: '🔋', label: 'Energía solar', value: '84–120 kW', sub: '8 paneles de 73 metros cada uno' },
  { icon: '🌡️', label: 'Temperatura exterior', value: '–157°C a +121°C', sub: 'Según exposición al sol' },
  { icon: '💧', label: 'Reciclaje de agua', value: '90%', sub: 'Incluye orina y humedad' },
  { icon: '🌐', label: 'Visibilidad', value: 'A simple vista', sub: 'Brilla como Venus nocturno' },
  { icon: '📡', label: 'Módulos', value: '17 módulos presurizados', sub: 'De 5 agencias diferentes' },
  { icon: '🧪', label: 'Experimentos', value: `+${EXPERIMENTS_TOTAL.toLocaleString('es-ES')}`, sub: 'Desde biología hasta física' },
  { icon: '👤', label: 'Visitantes totales', value: `+${VISITORS_TOTAL}`, sub: 'De 20 países distintos' },
  { icon: '🌍', label: 'Países socios', value: `${COUNTRIES_TOTAL}`, sub: 'NASA, ESA, Roscosmos, JAXA, CSA' },
  { icon: '🏃', label: 'Velocidad punta', value: '28.800 km/h', sub: 'Récord registrado en 2018' },
  { icon: '🔭', label: 'Altitud máxima', value: '460 km', sub: 'Registrada en ajuste orbital' }
]

onMounted(async () => {
  await loadPosition()
  startPositionPolling(5000)
  clockInterval = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onBeforeUnmount(() => {
  stopPositionPolling()
  if (clockInterval) clearInterval(clockInterval)
})
</script>

<template>
  <div class="historia-page">

    <!-- ── Hero ── -->
    <header class="historia-hero">
      <p class="eyebrow">Desde 1998</p>
      <h1 class="display-title">Historia y estadísticas de la <span class="highlight">Estación Espacial Internacional</span></h1>
      <p class="hero-text">
        La ISS es el proyecto de ingeniería más ambicioso de la humanidad. Desde el lanzamiento
        del primer módulo en 1998, ha albergado de forma ininterrumpida a tripulantes de todo el
        mundo y se ha convertido en el laboratorio científico más avanzado fuera de la Tierra.
      </p>
      <div class="hero-badges">
        <span class="status-pill">{{ yearsSinceLaunch }} años en órbita</span>
        <span class="status-pill">{{ daysCrewed.toLocaleString('es-ES') }} días tripulada</span>
        <span class="badge badge-live">● En vivo</span>
      </div>
    </header>

    <!-- ── Estadísticas en tiempo real ── -->
    <section class="stats-section">
      <div class="section-header">
        <h2 class="section-title">📊 Estadísticas en tiempo real</h2>
        <p class="section-subtitle">Todos los datos se actualizan automáticamente usando la posición actual de la ISS y cálculos orbitales precisos.</p>
      </div>

      <div class="stats-primary">
        <div class="stat-card stat-highlight">
          <div class="stat-icon">🚀</div>
          <div class="stat-body">
            <div class="stat-value">{{ currentVelocity }} <span class="stat-unit">km/h</span></div>
            <div class="stat-label">Velocidad actual</div>
            <div class="stat-note">27× más rápido que un avión comercial</div>
          </div>
        </div>
        <div class="stat-card stat-highlight">
          <div class="stat-icon">📡</div>
          <div class="stat-body">
            <div class="stat-value">{{ currentAltitude }} <span class="stat-unit">km</span></div>
            <div class="stat-label">Altitud actual</div>
            <div class="stat-note">Sobre la superficie terrestre</div>
          </div>
        </div>
        <div class="stat-card stat-highlight">
          <div class="stat-icon">🔄</div>
          <div class="stat-body">
            <div class="stat-value">{{ orbitsCompleted.toLocaleString('es-ES') }}</div>
            <div class="stat-label">Órbitas completadas</div>
            <div class="stat-note">Desde el 20 de noviembre de 1998</div>
          </div>
        </div>
        <div class="stat-card stat-highlight">
          <div class="stat-icon">📏</div>
          <div class="stat-body">
            <div class="stat-value">{{ (kmTraveled / 1_000_000_000).toFixed(2) }} <span class="stat-unit">mil M km</span></div>
            <div class="stat-label">Distancia total recorrida</div>
            <div class="stat-note">{{ lightYearsTraveled }} años luz</div>
          </div>
        </div>
      </div>

      <div class="stats-secondary">
        <div class="stat-card">
          <div class="stat-icon-sm">📅</div>
          <div class="stat-label">Días en órbita</div>
          <div class="stat-value-sm">{{ daysSinceLaunch.toLocaleString('es-ES') }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-sm">👥</div>
          <div class="stat-label">Días habitada sin pausa</div>
          <div class="stat-value-sm">{{ daysCrewed.toLocaleString('es-ES') }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-sm">🔄</div>
          <div class="stat-label">Órbitas completadas hoy</div>
          <div class="stat-value-sm">{{ orbitsToday }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-sm">📐</div>
          <div class="stat-label">Km recorridos hoy</div>
          <div class="stat-value-sm">{{ kmToday }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-sm">⏱️</div>
          <div class="stat-label">Período orbital</div>
          <div class="stat-value-sm">92 min 39 s</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-sm">🌅</div>
          <div class="stat-label">Amaneceres al día</div>
          <div class="stat-value-sm">16</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-sm">🌡️</div>
          <div class="stat-label">Temperatura interior</div>
          <div class="stat-value-sm">18–27 °C</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-sm">🔭</div>
          <div class="stat-label">Módulos presurizados</div>
          <div class="stat-value-sm">17</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-sm">🧪</div>
          <div class="stat-label">Experimentos realizados</div>
          <div class="stat-value-sm">+3.000</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-sm">👤</div>
          <div class="stat-label">Personas que han visitado</div>
          <div class="stat-value-sm">+280</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-sm">🌍</div>
          <div class="stat-label">Países participantes</div>
          <div class="stat-value-sm">15</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-sm">💰</div>
          <div class="stat-label">Coste estimado total</div>
          <div class="stat-value-sm">+150.000 M$</div>
        </div>
      </div>
    </section>

    <!-- ── Curiosidades destacadas ── -->
    <section class="facts-section">
      <div class="section-header">
        <h2 class="section-title">🛸 Datos y curiosidades</h2>
        <p class="section-subtitle">Dimensiones, récords y características técnicas de la ISS.</p>
      </div>
      <div class="facts-grid">
        <div v-for="fact in facts" :key="fact.label" class="fact-card">
          <div class="fact-icon">{{ fact.icon }}</div>
          <div class="fact-label">{{ fact.label }}</div>
          <div class="fact-value">{{ fact.value }}</div>
          <div class="fact-sub">{{ fact.sub }}</div>
        </div>
      </div>
    </section>

    <!-- ── Línea de tiempo ── -->
    <section class="timeline-section">
      <div class="section-header">
        <h2 class="section-title">🗓️ Línea de tiempo histórica</h2>
        <p class="section-subtitle">Los momentos clave que dieron forma a la estación espacial más grande jamás construida.</p>
      </div>

      <div class="timeline">
        <div
          v-for="(milestone, index) in milestones"
          :key="index"
          class="timeline-item"
          :class="{ 'is-right': index % 2 !== 0 }"
        >
          <div class="timeline-dot" :style="{ background: milestone.color, boxShadow: `0 0 14px ${milestone.color}55` }">
            {{ milestone.icon }}
          </div>
          <div class="timeline-card">
            <div class="timeline-year" :style="{ color: milestone.color }">{{ milestone.year }}</div>
            <h3 class="timeline-title">{{ milestone.title }}</h3>
            <p class="timeline-text">{{ milestone.text }}</p>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<style scoped>
.historia-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px 80px;
  color: var(--text);
}

/* ── Hero ── */
.historia-hero {
  border: 1px solid var(--border);
  border-radius: var(--radius-2xl);
  background: linear-gradient(135deg, #0B1220 0%, var(--surface) 50%, #0B1830 100%);
  padding: 48px 40px;
  margin-bottom: 48px;
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
}

.historia-hero::before {
  content: '';
  position: absolute;
  top: -60%;
  right: -15%;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(110, 242, 216, 0.06) 0%, transparent 60%);
  pointer-events: none;
}

.historia-hero::after {
  content: '';
  position: absolute;
  bottom: -40%;
  left: -10%;
  width: 400px;
  height: 400px;
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
  max-width: 680px;
  color: var(--text-soft);
  font-size: 1.05rem;
  line-height: 1.7;
  margin: 0 0 24px;
}

.hero-badges {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

/* ── Section header ── */
.section-header {
  margin-bottom: 28px;
}

.section-header .section-subtitle {
  color: var(--text-soft);
  font-size: 1rem;
  margin-top: 6px;
}

/* ── Stats ── */
.stats-section {
  margin-bottom: 56px;
}

.stats-primary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.stats-secondary {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
  gap: 12px;
}

.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
}

.stat-card:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.35), 0 0 18px var(--glow);
}

.stat-highlight {
  flex-direction: row;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, var(--surface) 0%, #0B1830 100%);
  border-color: var(--border);
  padding: 24px;
}

.stat-highlight:hover {
  border-color: var(--accent);
  box-shadow: 0 12px 32px rgba(0,0,0,0.35), 0 0 20px var(--glow-accent);
}

.stat-icon {
  font-size: 2.2rem;
  flex-shrink: 0;
}

.stat-icon-sm {
  font-size: 1.4rem;
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 1.85rem;
  font-weight: 800;
  color: var(--accent);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.stat-value-sm {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--primary);
  font-variant-numeric: tabular-nums;
}

.stat-unit {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-soft);
}

.stat-label {
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-soft);
}

.stat-note {
  font-size: 0.8rem;
  color: var(--text-dim);
}

/* ── Facts ── */
.facts-section {
  margin-bottom: 56px;
}

.facts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 14px;
}

.fact-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: border-color 0.25s ease, transform 0.2s ease;
}

.fact-card:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
}

.fact-icon {
  font-size: 1.6rem;
  margin-bottom: 6px;
}

.fact-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-dim);
}

.fact-value {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--accent);
}

.fact-sub {
  font-size: 0.78rem;
  color: var(--text-soft);
}

/* ── Timeline ── */
.timeline-section {
  margin-bottom: 32px;
}

.timeline {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* Línea central */
.timeline::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  background: linear-gradient(to bottom, var(--accent), var(--primary), var(--border));
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 0;
  position: relative;
  padding: 0 0 36px;
  /* Por defecto va a la izquierda */
  justify-content: flex-start;
}

.timeline-item.is-right {
  justify-content: flex-end;
}

.timeline-dot {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 16px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--surface-2);
  border: 2px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  z-index: 2;
  flex-shrink: 0;
}

.timeline-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 20px 22px;
  width: calc(50% - 36px);
  box-shadow: var(--shadow-soft);
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.timeline-card:hover {
  border-color: var(--primary);
  box-shadow: 0 12px 32px rgba(0,0,0,0.35), 0 0 18px var(--glow);
}

.timeline-year {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  margin-bottom: 4px;
}

.timeline-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 8px;
}

.timeline-text {
  font-size: 0.9rem;
  color: var(--text-soft);
  line-height: 1.65;
  margin: 0;
}

/* ── Badges ── */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
}

.badge-live {
  background: rgba(56, 211, 159, 0.15);
  color: var(--success);
  border: 1px solid rgba(56, 211, 159, 0.3);
  animation: blink 1.8s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* ── Responsive ── */
@media (max-width: 820px) {
  .historia-page {
    padding: 24px 16px 56px;
  }

  .historia-hero {
    padding: 28px 20px;
  }

  .stats-primary {
    grid-template-columns: 1fr;
  }

  .stats-secondary {
    grid-template-columns: repeat(auto-fill, minmax(145px, 1fr));
  }

  .facts-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  /* Línea de tiempo mobile: todo a la izquierda */
  .timeline::before {
    left: 22px;
  }

  .timeline-item,
  .timeline-item.is-right {
    justify-content: flex-start;
    padding-left: 64px;
  }

  .timeline-dot {
    left: 22px;
    top: 14px;
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }

  .timeline-card {
    width: 100%;
  }
}
</style>
