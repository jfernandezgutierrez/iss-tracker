<script setup>
import MapISS from '../components/map/MapISS.vue'
import PanelISS from '../components/panels/PanelISS.vue'
import { ref, computed, onBeforeUnmount, nextTick } from 'vue'

useHead({
  title: 'ISS en tiempo real — Mapa en vivo de la Estación Espacial Internacional',
  meta: [
    {
      name: 'description',
      content: 'Mira dónde está la ISS ahora mismo en un mapa en vivo. Sigue la órbita, consulta la tripulación a bordo, calcula el próximo paso de la Estación Espacial Internacional sobre tu ubicación y accede a los directos oficiales de la NASA.'
    },
    {
      name: 'keywords',
      content: 'dónde está la ISS ahora, ISS en tiempo real, mapa ISS, seguir ISS, posición actual Estación Espacial Internacional, órbita ISS, trayectoria ISS'
    },
    { property: 'og:title', content: 'ISS en tiempo real — Mapa en vivo de la Estación Espacial Internacional' },
    {
      property: 'og:description',
      content: 'Posición en directo de la ISS sobre el mapa, tripulación actual y directos de la NASA.'
    },
    { property: 'og:url', content: 'https://isstrackerlive.es/' }
  ],
  link: [
    { rel: 'canonical', href: 'https://isstrackerlive.es/' }
  ]
})

const leftWidth = ref(70)
const isDragging = ref(false)
const mapRef = ref(null)

const leftStyle = computed(() => ({
  width: `${leftWidth.value}%`
}))

const rightStyle = computed(() => ({
  width: `${100 - leftWidth.value}%`
}))

function refreshMap() {
  nextTick(() => {
    mapRef.value?.refreshMapSize?.()
  })
}

function startDragging() {
  if (window.innerWidth <= 768) return

  isDragging.value = true
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'col-resize'

  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDragging)
}

function onDrag(e) {
  if (!isDragging.value) return

  const main = document.querySelector('.main')
  if (!main) return

  const rect = main.getBoundingClientRect()
  const percent = ((e.clientX - rect.left) / rect.width) * 100

  leftWidth.value = Math.min(85, Math.max(40, percent))
  refreshMap()
}

function stopDragging() {
  isDragging.value = false
  document.body.style.userSelect = ''
  document.body.style.cursor = ''

  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDragging)

  refreshMap()
}

onBeforeUnmount(() => {
  stopDragging()
})
</script>

<template>
  <main class="main">
    <!-- Encabezado SEO oculto visualmente pero leído por buscadores y lectores de pantalla -->
    <h1 class="visually-hidden">
      ISS Tracker en tiempo real: posición actual de la Estación Espacial Internacional sobre el mapa
    </h1>
    <p class="visually-hidden">
      Sigue la órbita de la ISS en directo, consulta la tripulación a bordo, los directos oficiales
      de la NASA y calcula cuándo pasará la Estación Espacial Internacional sobre tu ubicación.
    </p>

    <section class="map-container" :style="leftStyle" aria-label="Mapa en vivo de la Estación Espacial Internacional">
      <MapISS ref="mapRef" />
    </section>

    <div class="resizer" @mousedown="startDragging" role="separator" aria-label="Redimensionar mapa y panel"></div>

    <section class="panel-container" :style="rightStyle" aria-label="Datos en tiempo real de la ISS">
      <PanelISS />
    </section>
  </main>
</template>

<style scoped>
.main {
  height: calc(100vh - 60px);
  display: flex;
  min-height: 0;
  background: var(--bg);
}

.map-container,
.panel-container {
  min-width: 0;
  min-height: 0;
  height: 100%;
}

.resizer {
  width: 8px;
  background: var(--surface-2);
  cursor: col-resize;
  flex-shrink: 0;
  transition: background 0.2s ease;
}

.resizer:hover {
  background: var(--primary);
}

/* Utilidad para texto accesible pero visualmente oculto */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 768px) {
  .main {
    flex-direction: column;
    height: calc(100vh - 60px);
  }

  .map-container,
  .panel-container {
    width: 100% !important;
  }

  .map-container {
    height: 50vh;
  }

  .panel-container {
    height: 50vh;
  }

  .resizer {
    display: none;
  }
}
</style>
