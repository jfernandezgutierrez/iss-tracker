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
    padding: 16px;
    background: #111;
    color: white;
    overflow-y: auto;
    box-sizing: border-box;
}

.panel-section {
    border: 1px solid #2a2a2a;
    border-radius: 10px;
    margin-bottom: 12px;
    background: #181818;
    overflow: hidden;
}

.panel-section summary {
    list-style: none;
    cursor: pointer;
    padding: 14px 16px;
    font-weight: 700;
    background: #1f1f1f;
    border-bottom: 1px solid #2a2a2a;
}

.panel-section summary::-webkit-details-marker {
    display: none;
}

.panel-section[open] summary {
    background: #252525;
}

.panel-section :deep(.section-content) {
    padding: 16px;
}
</style>