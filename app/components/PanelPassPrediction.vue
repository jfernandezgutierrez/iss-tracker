<script setup lang="ts">
import { computed, ref } from 'vue'

interface PassItem {
    risetime: number
    duration: number
    visible: boolean
}

const latitude = ref('')
const longitude = ref('')

const loading = ref(false)
const error = ref<string | null>(null)
const results = ref<PassItem[]>([])

const hasResults = computed(() => results.value.length > 0)

function useMyLocation() {
    error.value = null

    if (!navigator.geolocation) {
        error.value = 'La geolocalización no está disponible en este navegador.'
        return
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            latitude.value = position.coords.latitude.toFixed(6)
            longitude.value = position.coords.longitude.toFixed(6)
        },
        () => {
            error.value = 'No se pudo obtener tu ubicación.'
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    )
}
function visibilityText(visible: boolean) {
    return visible ? 'Visible' : 'No visible'
}

function visibilityClass(visible: boolean) {
    return visible ? 'visible' : 'not-visible'
}
function isValidCoordinate(value: string, min: number, max: number) {
    const num = Number(value)
    return !Number.isNaN(num) && num >= min && num <= max
}

async function calculatePass() {
    error.value = null
    results.value = []

    if (!isValidCoordinate(latitude.value, -90, 90)) {
        error.value = 'La latitud debe estar entre -90 y 90.'
        return
    }

    if (!isValidCoordinate(longitude.value, -180, 180)) {
        error.value = 'La longitud debe estar entre -180 y 180.'
        return
    }

    loading.value = true

    try {
        // TODO: conectar aquí la API real
        // De momento metemos mock para cerrar el flujo visual
        await new Promise(resolve => setTimeout(resolve, 700))

        const now = Math.floor(Date.now() / 1000)

        results.value = [
            {
                risetime: now + 3600,
                duration: 420,
                visible: true
            },
            {
                risetime: now + 7200,
                duration: 380,
                visible: false
            },
            {
                risetime: now + 14400,
                duration: 510,
                visible: true
            }
        ]
    } catch (err: any) {
        error.value = err?.message || 'No se pudo calcular el próximo paso.'
    } finally {
        loading.value = false
    }
}

function formatDate(timestamp: number) {
    return new Date(timestamp * 1000).toLocaleString('es-ES', {
        dateStyle: 'medium',
        timeStyle: 'short'
    })
}

function formatDuration(seconds: number) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    if (minutes <= 0) {
        return `${remainingSeconds}s`
    }

    return `${minutes}m ${remainingSeconds}s`
}
</script>

<template>
    <div class="section-content">
        <div class="form-grid">
            <div class="field">
                <label for="lat">Latitud</label>
                <input id="lat" v-model="latitude" type="number" step="any" placeholder="Ej. 43.4623" />
            </div>

            <div class="field">
                <label for="lng">Longitud</label>
                <input id="lng" v-model="longitude" type="number" step="any" placeholder="Ej. -3.8099" />
            </div>
        </div>

        <div class="actions">
            <button class="secondary-btn" @click="useMyLocation">
                Usar mi ubicación
            </button>

            <button class="primary-btn" @click="calculatePass">
                Calcular paso
            </button>
        </div>

        <p v-if="loading" class="status-msg">Calculando próximos pasos...</p>
        <p v-else-if="error" class="error-msg">{{ error }}</p>

        <div v-else-if="hasResults" class="results">
            <div v-for="(item, index) in results" :key="`${item.risetime}-${index}`" class="result-card">
                <p><strong>Paso:</strong> {{ index + 1 }}</p>
                <p><strong>Hora:</strong> {{ formatDate(item.risetime) }}</p>
                <p><strong>Duración:</strong> {{ formatDuration(item.duration) }}</p>
                <p>
                    <strong>Visibilidad:</strong>
                    <span :class="visibilityClass(item.visible)">
                        {{ visibilityText(item.visible) }}
                    </span>
                </p>
            </div>
        </div>

        <p v-else class="empty-msg">
            Introduce unas coordenadas o usa tu ubicación para calcular el próximo paso.
        </p>
    </div>
</template>

<style scoped>
.form-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
}

.field {
    display: flex;
    flex-direction: column;
}

label {
    margin-bottom: 6px;
    font-size: 14px;
    color: #d6d6d6;
}

input {
    padding: 10px 12px;
    border: 1px solid #2f2f2f;
    border-radius: 10px;
    background: #101010;
    color: #fff;
    outline: none;
}

input:focus {
    border-color: #4c8dff;
}

.actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 14px;
}

button {
    border: none;
    border-radius: 10px;
    padding: 10px 14px;
    cursor: pointer;
    font-weight: 600;
}

.primary-btn {
    background: #2d6cdf;
    color: white;
}

.secondary-btn {
    background: #2a2a2a;
    color: white;
}

.status-msg,
.error-msg,
.empty-msg {
    margin-top: 14px;
}

.error-msg {
    color: #ff9d9d;
}

.results {
    display: grid;
    gap: 10px;
    margin-top: 14px;
}

.result-card {
    background: #181818;
    border: 1px solid #2b2b2b;
    border-radius: 12px;
    padding: 12px;
}

.result-card p {
    margin: 6px 0;
}
.visible {
  color: #4caf50;
  font-weight: 600;
}

.not-visible {
  color: #ff6b6b;
  font-weight: 600;
}
</style>