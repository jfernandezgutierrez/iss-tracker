<template>
    <ClientOnly>
        <div ref="mapEl" id="map"></div>
    </ClientOnly>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick, watch } from 'vue'
import 'leaflet/dist/leaflet.css'
import { useIss } from '../composables/useIss'

const mapEl = ref < HTMLElement | null > (null)
const { position, loadPosition, startPositionPolling, stopPositionPolling } = useIss()

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
#map {
    width: 100%;
    height: 100%;
}
</style>