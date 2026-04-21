<script setup>
import MapISS from '../components/MapISS.vue'
import PanelISS from '../components/PanelISS.vue'
import { ref, computed, onBeforeUnmount, nextTick } from 'vue'

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
    <section class="map-container" :style="leftStyle">
      <MapISS ref="mapRef" />
    </section>

    <div class="resizer" @mousedown="startDragging"></div>

    <section class="panel-container" :style="rightStyle">
      <PanelISS />
    </section>
  </main>
</template>

<style scoped>
.main {
  height: calc(100vh - 60px);
  display: flex;
  min-height: 0;
}

.map-container,
.panel-container {
  min-width: 0;
  min-height: 0;
  height: 100%;
}

.resizer {
  width: 8px;
  background: #2a2a2a;
  cursor: col-resize;
  flex-shrink: 0;
}

.resizer:hover {
  background: #4a4a4a;
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