<template>
  <aside class="panel">
    <details open class="panel-section">
      <summary>Posición actual</summary>
      <PanelCurrentPosition />
    </details>

    <details class="panel-section">
      <summary>Astronautas a bordo</summary>
      <PanelAstronauts />
    </details>

    <details class="panel-section">
      <summary>Próximo paso sobre mi ubicación</summary>
      <PanelPassPrediction />
    </details>

    <details class="panel-section">
      <summary>Directo</summary>
      <PanelLive />
    </details>
    <div id="container-2361b580da27d32bb79de3389aa0d507"></div>
  </aside>
</template>

<script setup>
import { onMounted } from 'vue'
import PanelCurrentPosition from './PanelCurrentPosition.vue'
import PanelAstronauts from './PanelAstronauts.vue'
import PanelPassPrediction from './PanelPassPrediction.vue'
import PanelLive from './PanelLive.vue'

onMounted(() => {
  if (document.querySelector('script[data-adsterra-panel="true"]')) return

  const script = document.createElement('script')
  script.src = 'https://pl29208548.profitablecpmratenetwork.com/2361b580da27d32bb79de3389aa0d507/invoke.js'
  script.async = true
  script.setAttribute('data-cfasync', 'false')
  script.setAttribute('data-adsterra-panel', 'true')

  document.body.appendChild(script)
})
</script>

<style scoped>
.panel {
  height: 100%;
  padding: 18px;
  background: var(--surface-3);
  color: var(--text);
  overflow-y: auto;
  box-sizing: border-box;
  border-left: 1px solid var(--border);
}

.panel-section {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  margin-bottom: 14px;
  background: var(--surface);
  overflow: hidden;
  box-shadow: var(--shadow-soft);
}

.panel-section summary {
  list-style: none;
  cursor: pointer;
  padding: 14px 16px;
  font-weight: 700;
  font-size: 0.98rem;
  color: var(--text);
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
  position: relative;
  transition: background 0.2s ease, color 0.2s ease;
}

.panel-section summary:hover {
  color: var(--accent);
}

.panel-section summary::-webkit-details-marker {
  display: none;
}

.panel-section summary::after {
  content: '+';
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-soft);
  font-size: 1.2rem;
  font-weight: 700;
  transition: transform 0.2s ease, color 0.2s ease;
}

.panel-section[open] summary::after {
  content: '−';
  color: var(--accent);
}

.panel-section[open] summary {
  background: var(--surface);
  color: var(--accent);
}

.panel-section :deep(.section-content) {
  padding: 16px;
}
</style>
