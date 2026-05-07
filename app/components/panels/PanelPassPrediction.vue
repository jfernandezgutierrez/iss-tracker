<script setup lang="ts">
import { computed, ref } from 'vue'
import { useIssPass, azimuthToCardinal } from '../../composables/useIssPass'
import { useIssNotifications } from '../../composables/useIssNotifications'

const latitude = ref('')
const longitude = ref('')

const locationError = ref<string | null>(null)

const { passes, loading, error, predictPasses } = useIssPass()

const {
    isSupported: notifSupported,
    isGranted: notifGranted,
    isDenied: notifDenied,
    hasAlarmFor,
    getAlarmFor,
    scheduleForPass,
    cancelForPass
} = useIssNotifications()

// Antelación seleccionada por el usuario (en minutos)
const leadMinutes = ref<number>(15)
const leadOptions = [5, 15, 30]

// Detección de iOS para mostrar aviso (Safari requiere PWA instalada)
const isIos = computed(() => {
    if (typeof navigator === 'undefined') return false
    return /iPad|iPhone|iPod/.test(navigator.userAgent)
})
const isStandalone = computed(() => {
    if (typeof window === 'undefined') return false
    const navStd = (navigator as any).standalone === true
    const mqStd = window.matchMedia?.('(display-mode: standalone)')?.matches
    return Boolean(navStd || mqStd)
})

const hasResults = computed(() => passes.value.length > 0)

const notifNotice = computed(() => {
    if (!notifSupported.value) {
        return 'Tu navegador no admite notificaciones web.'
    }
    if (notifDenied.value) {
        return 'Has bloqueado las notificaciones para este sitio. Cámbialo en los ajustes del navegador para volver a recibir avisos.'
    }
    if (isIos.value && !isStandalone.value) {
        return 'En iOS las notificaciones sólo funcionan si añades la web a tu pantalla de inicio (icono Compartir → "Añadir a pantalla de inicio").'
    }
    return null
})

async function toggleAlarm(passStartAt: number, visible: boolean) {
    if (hasAlarmFor(passStartAt)) {
        cancelForPass(passStartAt)
        return
    }
    const alarm = await scheduleForPass({
        passStartAt,
        leadMinutes: leadMinutes.value,
        visible
    })
    if (!alarm) {
        // si no se pudo (permiso denegado o paso ya cercano) lo reflejamos en notifNotice
    }
}

function alarmFireText(passStartAt: number): string | null {
    const a = getAlarmFor(passStartAt)
    if (!a) return null
    const dt = new Date(a.fireAt)
    const hora = dt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    return `Te avisaremos a las ${hora} (${a.leadMinutes} min antes)`
}

function useMyLocation() {
    locationError.value = null

    if (!navigator.geolocation) {
        locationError.value = 'La geolocalización no está disponible en este navegador.'
        return
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            latitude.value = position.coords.latitude.toFixed(6)
            longitude.value = position.coords.longitude.toFixed(6)
        },
        () => {
            locationError.value = 'No se pudo obtener tu ubicación. Revisa los permisos del navegador.'
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    )
}

function visibilityText(visible: boolean) {
    return visible ? 'Visible a simple vista' : 'Sólo con instrumentos'
}

function visibilityClass(visible: boolean) {
    return visible ? 'badge badge-success' : 'badge badge-danger'
}

function isValidCoordinate(value: string, min: number, max: number) {
    const num = Number(value)
    return !Number.isNaN(num) && num >= min && num <= max
}

async function calculatePass() {
    locationError.value = null

    if (!isValidCoordinate(latitude.value, -90, 90)) {
        locationError.value = 'La latitud debe estar entre -90 y 90.'
        return
    }

    if (!isValidCoordinate(longitude.value, -180, 180)) {
        locationError.value = 'La longitud debe estar entre -180 y 180.'
        return
    }

    await predictPasses(Number(latitude.value), Number(longitude.value), 5, 48)
}

function formatDate(timestampMs: number) {
    return new Date(timestampMs).toLocaleString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
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

function directionLabel(deg: number) {
    return `${azimuthToCardinal(deg)} (${deg}°)`
}

const displayError = computed(() => locationError.value || error.value)
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
            <button class="btn btn-secondary" @click="useMyLocation" :disabled="loading">
                Usar mi ubicación
            </button>

            <button class="btn btn-primary" @click="calculatePass" :disabled="loading">
                {{ loading ? 'Calculando...' : 'Calcular paso' }}
            </button>
        </div>

        <p v-if="loading" class="status-msg">Calculando próximos pasos de la ISS…</p>
        <p v-else-if="displayError" class="soft-error">{{ displayError }}</p>

        <div v-else-if="hasResults" class="results">
            <div class="notif-controls">
                <label class="notif-lead">
                    Avisarme
                    <select v-model.number="leadMinutes" :disabled="!notifSupported || notifDenied" aria-label="Antelación del aviso">
                        <option v-for="opt in leadOptions" :key="opt" :value="opt">{{ opt }} min antes</option>
                    </select>
                </label>
                <p v-if="notifNotice" class="notif-notice">{{ notifNotice }}</p>
            </div>

            <div v-for="(item, index) in passes" :key="`${item.startTime}-${index}`" class="result-card">
                <div class="result-header">
                    <span class="result-index">Paso #{{ index + 1 }}</span>
                    <div class="result-header-right">
                        <span :class="visibilityClass(item.visible)">
                            {{ visibilityText(item.visible) }}
                        </span>
                        <button
                            class="bell-btn"
                            :class="{ active: hasAlarmFor(item.startTime) }"
                            :disabled="!notifSupported || notifDenied"
                            :aria-pressed="hasAlarmFor(item.startTime)"
                            :aria-label="hasAlarmFor(item.startTime) ? 'Cancelar aviso de este paso' : 'Activar aviso para este paso'"
                            :title="hasAlarmFor(item.startTime) ? 'Cancelar aviso' : 'Avisarme antes del paso'"
                            @click="toggleAlarm(item.startTime, item.visible)"
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                                <path
                                    v-if="hasAlarmFor(item.startTime)"
                                    fill="currentColor"
                                    d="M12 22a2.5 2.5 0 0 0 2.45-2H9.55A2.5 2.5 0 0 0 12 22Zm6-6V11a6 6 0 0 0-5-5.91V4a1 1 0 1 0-2 0v1.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1Z"
                                />
                                <path
                                    v-else
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.8"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M12 22a2.5 2.5 0 0 0 2.45-2H9.55A2.5 2.5 0 0 0 12 22Zm6-6V11a6 6 0 0 0-5-5.91V4a1 1 0 1 0-2 0v1.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1Z"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                <p v-if="hasAlarmFor(item.startTime)" class="alarm-meta">
                    {{ alarmFireText(item.startTime) }}
                </p>

                <div class="result-row">
                    <span class="result-label">Inicio</span>
                    <strong>{{ formatDate(item.startTime) }}</strong>
                </div>
                <div class="result-row">
                    <span class="result-label">Fin</span>
                    <strong>{{ formatDate(item.endTime) }}</strong>
                </div>
                <div class="result-row">
                    <span class="result-label">Duración</span>
                    <strong>{{ formatDuration(item.duration) }}</strong>
                </div>
                <div class="result-row">
                    <span class="result-label">Elevación máx.</span>
                    <strong>{{ item.maxElevation }}°</strong>
                </div>
                <div class="result-row">
                    <span class="result-label">Aparece por</span>
                    <strong>{{ directionLabel(item.startAzimuth) }}</strong>
                </div>
                <div class="result-row">
                    <span class="result-label">Desaparece por</span>
                    <strong>{{ directionLabel(item.endAzimuth) }}</strong>
                </div>
            </div>
        </div>

        <p v-else-if="!loading && !displayError && latitude && longitude" class="empty-msg">
            No se han encontrado pasos de la ISS sobre tu ubicación en las próximas 48 horas.
        </p>

        <p v-else class="empty-msg">
            Introduce tus coordenadas o usa tu ubicación actual para calcular cuándo pasará la
            Estación Espacial Internacional sobre ti y si será visible a simple vista.
        </p>
    </div>
</template>

<style scoped>
.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.field {
    display: flex;
    flex-direction: column;
}

.actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 14px;
}

.status-msg,
.empty-msg {
    margin-top: 14px;
    color: var(--text-soft);
    font-size: 0.9rem;
}

.results {
    display: grid;
    gap: 10px;
    margin-top: 16px;
}

.result-card {
    background: var(--surface-3);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 14px;
    transition: border-color 0.2s ease, transform 0.2s ease;
}

.result-card:hover {
    border-color: var(--primary);
    transform: translateY(-1px);
}

.result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.result-index {
    color: var(--accent);
    font-weight: 700;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
}

.result-row {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 6px 0;
    font-size: 0.9rem;
    border-top: 1px solid var(--border-soft);
}

.result-label {
    color: var(--text-soft);
}

.result-row strong {
    color: var(--text);
    font-weight: 600;
    text-align: right;
}

.result-header-right {
    display: flex;
    align-items: center;
    gap: 8px;
}

.bell-btn {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-soft);
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}

.bell-btn:hover:not(:disabled) {
    color: var(--accent);
    border-color: var(--accent);
    transform: translateY(-1px);
}

.bell-btn.active {
    background: rgba(110, 242, 216, 0.15);
    color: var(--accent);
    border-color: var(--accent);
}

.bell-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.alarm-meta {
    margin: 4px 0 10px;
    font-size: 0.8rem;
    color: var(--accent);
}

.notif-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 16px;
    align-items: center;
    padding: 10px 12px;
    background: var(--surface-3);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    margin-bottom: 12px;
}

.notif-lead {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    color: var(--text);
}

.notif-lead select {
    background: var(--surface-2);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: var(--radius-md, 8px);
    padding: 4px 8px;
    font-size: 0.85rem;
}

.notif-notice {
    margin: 0;
    flex: 1 1 100%;
    font-size: 0.78rem;
    color: var(--text-soft);
    line-height: 1.4;
}

@media (max-width: 480px) {
    .form-grid {
        grid-template-columns: 1fr;
    }
}
</style>
