<script setup lang="ts">
/**
 * Banner de cookies conforme al RGPD / ePrivacy.
 * Guarda el consentimiento en localStorage con clave 'iss_cookie_consent'.
 * Integra con Google AdSense (gtag consent mode v2).
 */
import { onMounted, ref } from 'vue'

type ConsentLevel = 'all' | 'essential' | null

const STORAGE_KEY = 'iss_cookie_consent'
const CONSENT_VERSION = '1'

const visible = ref(false)
const showDetails = ref(false)
const analytics = ref(true)
const marketing = ref(true)
const saving = ref(false)

function getStored(): { level: ConsentLevel; version: string } | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function pushGtag(level: ConsentLevel) {
  if (typeof window === 'undefined') return
  const w = window as any
  if (!w.gtag) return
  const isAll = level === 'all'
  w.gtag('consent', 'update', {
    ad_storage: isAll ? 'granted' : 'denied',
    ad_user_data: isAll ? 'granted' : 'denied',
    ad_personalization: isAll ? 'granted' : 'denied',
    analytics_storage: isAll ? 'granted' : 'denied'
  })
}

function save(level: ConsentLevel) {
  saving.value = true
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ level, version: CONSENT_VERSION, ts: Date.now() })
    )
    pushGtag(level)
  } finally {
    saving.value = false
    visible.value = false
  }
}

function acceptAll() {
  analytics.value = true
  marketing.value = true
  save('all')
}

function acceptSelected() {
  save(analytics.value || marketing.value ? 'all' : 'essential')
}

function rejectAll() {
  analytics.value = false
  marketing.value = false
  save('essential')
}

onMounted(() => {
  const stored = getStored()
  if (!stored || stored.version !== CONSENT_VERSION) {
    // Primera visita o versión cambiada
    visible.value = true
    // Gtag consent mode: denegado por defecto hasta que el usuario decida
    const w = window as any
    if (w.gtag) {
      w.gtag('consent', 'default', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
        wait_for_update: 2000
      })
    }
  } else {
    // Ya hay consentimiento: aplica inmediatamente
    pushGtag(stored.level)
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="cookie-slide">
      <div v-if="visible" class="cookie-banner" role="dialog" aria-modal="true" aria-label="Consentimiento de cookies">

        <!-- Panel principal -->
        <div v-if="!showDetails" class="cookie-main">
          <div class="cookie-header">
            <span class="cookie-emoji">🍪</span>
            <div>
              <h2 class="cookie-title">Usamos cookies</h2>
              <p class="cookie-text">
                Utilizamos cookies propias y de terceros (Google AdSense, Analytics) para mejorar
                tu experiencia y mostrarte publicidad relevante. Puedes aceptarlas todas, rechazarlas
                o personalizar tu elección. Tu privacidad es importante para nosotros.
              </p>
              <a href="/privacy-policy" class="cookie-policy-link" target="_blank" rel="noopener">
                Política de privacidad →
              </a>
            </div>
          </div>

          <div class="cookie-actions">
            <button class="btn-cookie btn-accept-all" @click="acceptAll">
              Aceptar todas
            </button>
            <button class="btn-cookie btn-reject" @click="rejectAll">
              Solo esenciales
            </button>
            <button class="btn-cookie btn-customize" @click="showDetails = true">
              Personalizar
            </button>
          </div>
        </div>

        <!-- Panel de personalización -->
        <div v-else class="cookie-details">
          <div class="cookie-header">
            <span class="cookie-emoji">⚙️</span>
            <div>
              <h2 class="cookie-title">Personalizar preferencias</h2>
              <p class="cookie-text">
                Elige qué tipos de cookies deseas permitir. Las cookies esenciales siempre están
                activas porque son necesarias para el funcionamiento del sitio.
              </p>
            </div>
          </div>

          <div class="cookie-toggles">
            <!-- Esenciales: siempre activas -->
            <div class="cookie-toggle-row">
              <div class="toggle-info">
                <span class="toggle-name">🔒 Cookies esenciales</span>
                <span class="toggle-desc">Necesarias para el funcionamiento del sitio. No se pueden desactivar.</span>
              </div>
              <div class="toggle-switch toggle-always-on" aria-checked="true" role="switch">
                <span class="toggle-thumb"></span>
              </div>
            </div>

            <!-- Analíticas -->
            <div class="cookie-toggle-row">
              <div class="toggle-info">
                <span class="toggle-name">📊 Cookies analíticas</span>
                <span class="toggle-desc">Nos ayudan a entender cómo se usa el sitio (Google Analytics). Datos anónimos.</span>
              </div>
              <button
                class="toggle-switch"
                :class="{ 'is-on': analytics }"
                :aria-checked="analytics"
                role="switch"
                aria-label="Cookies analíticas"
                @click="analytics = !analytics"
              >
                <span class="toggle-thumb"></span>
              </button>
            </div>

            <!-- Marketing / Publicidad -->
            <div class="cookie-toggle-row">
              <div class="toggle-info">
                <span class="toggle-name">📢 Cookies publicitarias</span>
                <span class="toggle-desc">Usadas por Google AdSense para mostrarte anuncios relevantes según tus intereses.</span>
              </div>
              <button
                class="toggle-switch"
                :class="{ 'is-on': marketing }"
                :aria-checked="marketing"
                role="switch"
                aria-label="Cookies publicitarias"
                @click="marketing = !marketing"
              >
                <span class="toggle-thumb"></span>
              </button>
            </div>
          </div>

          <div class="cookie-actions">
            <button class="btn-cookie btn-accept-all" @click="acceptSelected">
              Guardar preferencias
            </button>
            <button class="btn-cookie btn-reject" @click="rejectAll">
              Rechazar todas
            </button>
            <button class="btn-cookie btn-customize" @click="showDetails = false">
              ← Volver
            </button>
          </div>
        </div>

      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.cookie-banner {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 40px);
  max-width: 860px;
  z-index: 9000;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-2xl);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(77, 163, 255, 0.1);
  overflow: hidden;
}

/* ── Header ── */
.cookie-header {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 20px 22px 14px;
}

.cookie-emoji {
  font-size: 1.8rem;
  flex-shrink: 0;
  line-height: 1;
  margin-top: 2px;
}

.cookie-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 6px;
}

.cookie-text {
  font-size: 0.85rem;
  color: var(--text-soft);
  line-height: 1.55;
  margin: 0 0 6px;
}

.cookie-policy-link {
  font-size: 0.8rem;
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
}

.cookie-policy-link:hover {
  color: var(--accent);
}

/* ── Botones ── */
.cookie-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding: 0 22px 20px;
}

.btn-cookie {
  padding: 9px 20px;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-accept-all {
  background: var(--primary);
  color: #07111F;
  box-shadow: 0 0 16px var(--glow);
}

.btn-accept-all:hover {
  background: var(--accent);
  box-shadow: 0 0 22px var(--glow-accent);
}

.btn-reject {
  background: var(--surface-2);
  color: var(--text-soft);
  border: 1px solid var(--border);
}

.btn-reject:hover {
  background: var(--surface-3);
  color: var(--text);
  border-color: var(--primary);
}

.btn-customize {
  background: transparent;
  color: var(--text-dim);
  border: 1px solid var(--border-soft);
  font-size: 0.8rem;
}

.btn-customize:hover {
  color: var(--text-soft);
  border-color: var(--border);
}

/* ── Toggles ── */
.cookie-toggles {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0 22px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.cookie-toggle-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}

.cookie-toggle-row:last-child {
  border-bottom: none;
}

.toggle-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toggle-name {
  font-size: 0.87rem;
  font-weight: 700;
  color: var(--text);
}

.toggle-desc {
  font-size: 0.76rem;
  color: var(--text-soft);
  line-height: 1.4;
}

.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 999px;
  background: var(--surface-3);
  border: 1px solid var(--border);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s ease, border-color 0.2s ease;
  padding: 0;
}

.toggle-switch.is-on,
.toggle-always-on {
  background: var(--primary);
  border-color: var(--primary-strong);
}

.toggle-always-on {
  cursor: default;
  opacity: 0.8;
}

.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s ease;
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  display: block;
}

.toggle-switch.is-on .toggle-thumb,
.toggle-always-on .toggle-thumb {
  transform: translateX(20px);
}

/* ── Transición ── */
.cookie-slide-enter-active,
.cookie-slide-leave-active {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
}

.cookie-slide-enter-from,
.cookie-slide-leave-to {
  transform: translateX(-50%) translateY(120%);
  opacity: 0;
}

/* ── Responsive ── */
@media (max-width: 600px) {
  .cookie-banner {
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    transform: none;
    border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
  }

  .cookie-slide-enter-from,
  .cookie-slide-leave-to {
    transform: translateY(100%);
    opacity: 0;
  }

  .cookie-actions {
    flex-direction: column;
  }

  .btn-cookie {
    width: 100%;
    text-align: center;
  }
}
</style>
