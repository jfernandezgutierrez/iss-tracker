<template>
    <div class="map-wrapper">
        <ClientOnly>
            <div ref="mapEl" id="map"></div>
        </ClientOnly>

        <Transition name="fade">
            <IssSpinner v-if="showSpinner" variant="overlay" size="lg" label="Localizando la ISS" />
        </Transition>

        <!-- Toggle único para seguir / dejar de seguir la ISS -->
        <Transition name="fade">
            <button
                v-if="!showSpinner"
                class="follow-btn"
                :class="{ 'is-active': follow }"
                type="button"
                :aria-pressed="follow"
                @click="toggleFollow"
            >
                <span class="follow-dot"></span>
                {{ follow ? 'Siguiendo a la ISS' : 'Seguir a la ISS' }}
            </button>
        </Transition>

        <!-- Leyenda de la órbita -->
        <div class="orbit-legend" v-if="!showSpinner">
            <div class="legend-row">
                <span class="legend-swatch swatch-past"></span>
                Recorrido hecho
            </div>
            <div class="legend-row">
                <span class="legend-swatch swatch-future"></span>
                Siguiente órbita
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, nextTick, watch } from 'vue'
import 'leaflet/dist/leaflet.css'
import { useIss } from '../../composables/useIss'
import { useIssOrbit, splitOnAntimeridian } from '../../composables/useIssOrbit'
import IssSpinner from '../layout/IssSpinner.vue'

const mapEl = ref<HTMLElement | null>(null)
const mapReady = ref(false)
const follow = ref(true)

const {
    position,
    loadPosition,
    startPositionPolling,
    stopPositionPolling
} = useIss()

const {
    pastPath,
    futurePath,
    loadOrbit,
    startOrbitRefresh,
    stopOrbitRefresh
} = useIssOrbit()

// Mostramos el spinner hasta que tengamos posición Y el mapa esté inicializado.
const showSpinner = computed(() => !position.value || !mapReady.value)

let map: any = null
let marker: any = null
let LRef: any = null

// Capas donde guardamos las polilíneas para poder redibujarlas
let pastLayers: any[] = []
let futureLayers: any[] = []

// Flag interno para distinguir pan programático del pan del usuario
let programmaticPan = false

async function refreshMapSize() {
    await nextTick()
    if (map) {
        map.invalidateSize()
    }
}

defineExpose({
    refreshMapSize
})

function clearLayers(layers: any[]) {
    layers.forEach(layer => {
        if (map) map.removeLayer(layer)
    })
    layers.length = 0
}

function drawOrbit() {
    if (!map || !LRef) return

    clearLayers(pastLayers)
    clearLayers(futureLayers)

    // Estilo tramo pasado: turquesa sólido
    const pastSegments = splitOnAntimeridian(pastPath.value)
    pastSegments.forEach(segment => {
        if (segment.length < 2) return
        const latlngs = segment.map(p => [p.latitude, p.longitude] as [number, number])
        const layer = LRef.polyline(latlngs, {
            color: '#6EF2D8',
            weight: 2.5,
            opacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round'
        }).addTo(map)
        pastLayers.push(layer)
    })

    // Estilo tramo futuro: azul primario, discontinuo
    const futureSegments = splitOnAntimeridian(futurePath.value)
    futureSegments.forEach(segment => {
        if (segment.length < 2) return
        const latlngs = segment.map(p => [p.latitude, p.longitude] as [number, number])
        const layer = LRef.polyline(latlngs, {
            color: '#4DA3FF',
            weight: 2,
            opacity: 0.8,
            dashArray: '6, 6',
            lineCap: 'round',
            lineJoin: 'round'
        }).addTo(map)
        futureLayers.push(layer)
    })
}

function panToIss(latlng: [number, number], animate = true) {
    if (!map) return
    programmaticPan = true
    map.panTo(latlng, { animate, duration: animate ? 1 : 0 })
    // Reset flag en el siguiente tick para que los eventos de usuario sí cuenten
    setTimeout(() => {
        programmaticPan = false
    }, 1200)
}

function enableFollow() {
    follow.value = true
    if (position.value) {
        panToIss([position.value.latitude, position.value.longitude], true)
    }
}

function toggleFollow() {
    if (follow.value) {
        follow.value = false
    } else {
        enableFollow()
    }
}

onMounted(async () => {
    // Leaflet exporta tanto por default como con named exports; normalizamos.
    const leafletModule: any = await import('leaflet')
    const L: any = leafletModule.default || leafletModule
    LRef = L

    if (!mapEl.value || map) return

    map = L.map(mapEl.value, {
        worldCopyJump: true
    }).setView([20, 0], 2)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map)

    const issIcon = L.icon({
        iconUrl: '/iss-icon.svg',
        iconSize: [50, 50],
        iconAnchor: [25, 25],
    })

    // Si el usuario arrastra el mapa, paramos el seguimiento
    map.on('dragstart', () => {
        if (!programmaticPan) {
            follow.value = false
        }
    })
    // Si hace zoom manual también paramos el auto-follow (solo si lo hizo él)
    map.on('zoomstart', () => {
        if (!programmaticPan) {
            follow.value = false
        }
    })

    await loadPosition()

    if (position.value) {
        marker = L.marker(
            [position.value.latitude, position.value.longitude],
            { icon: issIcon }
        ).addTo(map)
        panToIss([position.value.latitude, position.value.longitude], false)
        map.setZoom(3)
    }

    startPositionPolling(5000)

    // Cargamos la órbita (TLE + propagación) y dibujamos la polilínea
    try {
        await loadOrbit()
    } catch (err) {
        console.error('[MapISS] Error cargando la órbita:', err)
    }

    // Dibujamos explícitamente después del load, por si los watchers no se
    // disparan (reactividad deep en arrays grandes puede ser caprichosa).
    drawOrbit()

    // Cada 30s re-propagamos para que el tramo pasado/futuro avance con la ISS
    startOrbitRefresh(30_000)

    watchPosition(issIcon)
    watchOrbit()

    setTimeout(() => {
        map.invalidateSize()
        drawOrbit()
        mapReady.value = true
    }, 100)
})

function watchPosition(issIcon: any) {
    const stop = watch(
        () => position.value,
        (value) => {
            if (!value || !map || !LRef) return

            const latlng: [number, number] = [value.latitude, value.longitude]

            if (!marker) {
                marker = LRef.marker(latlng, { icon: issIcon }).addTo(map)
            } else {
                marker.setLatLng(latlng)
            }

            // Si el follow está activo, movemos el mapa suavemente tras la ISS
            if (follow.value) {
                panToIss(latlng, true)
            }
        },
        { deep: true }
    )

    onUnmounted(() => {
        stop()
    })
}

function watchOrbit() {
    // Redibuja las polilíneas cuando el composable recalcula el recorrido.
    // Usamos length como trigger porque recomputePaths reasigna .value completo
    // y eso ya es suficiente para que watch dispare (sin necesidad de deep).
    const stopPast = watch(pastPath, () => drawOrbit())
    const stopFuture = watch(futurePath, () => drawOrbit())

    onUnmounted(() => {
        stopPast()
        stopFuture()
    })
}

onUnmounted(() => {
    stopPositionPolling()
    stopOrbitRefresh()

    clearLayers(pastLayers)
    clearLayers(futureLayers)

    if (map) {
        map.remove()
        map = null
    }
})
</script>

<style scoped>
.map-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
}

#map {
    width: 100%;
    height: 100%;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* ===================== Botón seguir ===================== */
.follow-btn {
    position: absolute;
    top: 18px;
    right: 18px;
    z-index: 500;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: rgba(11, 18, 32, 0.92);
    backdrop-filter: blur(8px);
    box-shadow: var(--shadow-soft);
    color: var(--text);
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
}

.follow-btn:hover {
    transform: translateY(-1px);
    border-color: var(--primary);
    background: rgba(77, 163, 255, 0.18);
}

.follow-btn.is-active {
    background: rgba(110, 242, 216, 0.18);
    border-color: #6EF2D8;
    color: #D8FFF5;
    box-shadow: 0 0 18px rgba(110, 242, 216, 0.35);
}

.follow-btn.is-active:hover {
    background: rgba(110, 242, 216, 0.26);
}

.follow-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #6EF2D8;
    box-shadow: 0 0 8px rgba(110, 242, 216, 0.9);
    animation: pulse-dot 1.6s ease-in-out infinite;
}

.follow-btn:not(.is-active) .follow-dot {
    background: var(--text-soft);
    box-shadow: none;
    animation: none;
    opacity: 0.5;
}

@keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.7); }
}

/* ===================== Leyenda ===================== */
.orbit-legend {
    position: absolute;
    bottom: 18px;
    left: 18px;
    z-index: 400;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: rgba(11, 18, 32, 0.88);
    backdrop-filter: blur(8px);
    box-shadow: var(--shadow-soft);
    color: var(--text);
    font-size: 0.82rem;
    font-weight: 600;
    pointer-events: none;
}

.legend-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.legend-swatch {
    width: 22px;
    height: 3px;
    border-radius: 2px;
    flex-shrink: 0;
}

.swatch-past {
    background: #6EF2D8;
    box-shadow: 0 0 8px rgba(110, 242, 216, 0.6);
}

.swatch-future {
    background: repeating-linear-gradient(90deg,
            #4DA3FF 0 6px,
            transparent 6px 10px);
}

@media (max-width: 560px) {
    .orbit-legend {
        bottom: 10px;
        left: 10px;
        padding: 8px 12px;
        font-size: 0.76rem;
    }

    .follow-btn {
        top: 10px;
        right: 10px;
        padding: 6px 12px;
        font-size: 0.76rem;
    }
}
</style>
