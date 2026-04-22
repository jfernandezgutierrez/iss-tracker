<template>
    <div class="map-wrapper">
        <ClientOnly>
            <div ref="mapEl" id="map"></div>
        </ClientOnly>

        <Transition name="fade">
            <IssSpinner
                v-if="showSpinner"
                variant="overlay"
                size="lg"
                label="Localizando la ISS"
            />
        </Transition>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, nextTick, watch } from 'vue'
import 'leaflet/dist/leaflet.css'
import { useIss } from '../../composables/useIss'
import IssSpinner from '../layout/IssSpinner.vue'

const mapEl = ref<HTMLElement | null>(null)
const mapReady = ref(false)
const {
    position,
    loadPosition,
    startPositionPolling,
    stopPositionPolling
} = useIss()

// Mostramos el spinner hasta que tengamos posición Y el mapa esté inicializado.
const showSpinner = computed(() => !position.value || !mapReady.value)

let map: any = null
let marker: any = null
let LRef: any = null

async function refreshMapSize() {
    await nextTick()
    if (map) {
        map.invalidateSize()
    }
}

defineExpose({
    refreshMapSize
})

onMounted(async () => {
    const L = await import('leaflet')
    LRef = L

    if (!mapEl.value || map) return

    map = L.map(mapEl.value).setView([20, 0], 2)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map)
    const issIcon = L.icon({
        iconUrl: '/iss-icon.svg',
        iconSize: [50, 50],
        iconAnchor: [25, 25],
    })
    await loadPosition()

    if (position.value) {
        marker = L.marker(
            [position.value.latitude, position.value.longitude],
            { icon: issIcon }
        ).addTo(map)
        map.setView([position.value.latitude, position.value.longitude], 3)
    }

    startPositionPolling(5000)

    watchPosition()

    setTimeout(() => {
        map.invalidateSize()
        mapReady.value = true
    }, 100)
})

function watchPosition() {
    const stop = watch(
        () => position.value,
        (value) => {
            if (!value || !map || !LRef) return

            const latlng: [number, number] = [value.latitude, value.longitude]

            if (!marker) {
                marker = LRef.marker(latlng).addTo(map)
            } else {
                marker.setLatLng(latlng)
            }
        },
        { deep: true }
    )

    onUnmounted(() => {
        stop()
    })
}

onUnmounted(() => {
    stopPositionPolling()

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
</style>
