import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

/**
 * Notificaciones de pasos de la ISS.
 *
 * Estrategia:
 *   - Cada alarma = { id, fireAt (epoch ms), payload {title, body, url} }.
 *   - Persistimos en localStorage bajo la clave ISS_PASS_ALARMS.
 *   - Si hay Service Worker disponible y permisos concedidos, le mandamos
 *     'schedule-pass' / 'cancel-pass' por postMessage. El SW mantiene los
 *     timers y dispara `showNotification` aunque la pestaña pierda foco.
 *   - Si no hay SW, fallback con setTimeout en la pestaña.
 *   - Al volver a abrir la app, el composable purga alarmas pasadas y re-
 *     programa las pendientes (por si el SW había sido descargado).
 *
 * Limitaciones:
 *   - En iOS sólo funciona si la PWA está instalada (Safari 16.4+).
 *   - `setTimeout` en SW puede perderse si el navegador descarga el worker;
 *     por eso el reconcile al abrir la app es clave.
 */

export interface PassAlarm {
  id: string                // identificador estable (p.ej. 'pass-<startTimeMs>')
  fireAt: number            // epoch ms — instante en que disparar la notificación
  passStartAt: number       // epoch ms — inicio real del paso (para mostrar)
  leadMinutes: number       // antelación elegida (5/15/30)
  payload: {
    title: string
    body: string
    url: string
    tag: string
  }
}

const STORAGE_KEY = 'iss_pass_alarms_v1'

// Estado reactivo compartido entre componentes
const alarms = ref<PassAlarm[]>([])
const permission = ref<NotificationPermission | 'unsupported'>('default')

// Timeouts vivos en la pestaña (fallback sin SW)
const tabTimers = new Map<string, ReturnType<typeof setTimeout>>()

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function loadFromStorage() {
  if (!isBrowser()) return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      alarms.value = []
      return
    }
    const parsed = JSON.parse(raw) as PassAlarm[]
    if (!Array.isArray(parsed)) {
      alarms.value = []
      return
    }
    // Limpia las que ya pasaron + 5 min de margen
    const cutoff = Date.now() - 5 * 60 * 1000
    alarms.value = parsed.filter(a => a.fireAt > cutoff)
    saveToStorage()
  } catch {
    alarms.value = []
  }
}

function saveToStorage() {
  if (!isBrowser()) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms.value))
  } catch {
    /* quota excedida o storage bloqueado, no es crítico */
  }
}

function refreshPermission() {
  if (!isBrowser() || typeof Notification === 'undefined') {
    permission.value = 'unsupported'
    return
  }
  permission.value = Notification.permission
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isBrowser() || !('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.ready
    return reg
  } catch {
    return null
  }
}

function postToSw(message: any) {
  if (!isBrowser() || !('serviceWorker' in navigator)) return
  navigator.serviceWorker.ready
    .then(reg => {
      reg.active?.postMessage(message)
    })
    .catch(() => {
      /* SW no disponible: el fallback de tab timer ya cubre */
    })
}

function scheduleTabTimer(alarm: PassAlarm) {
  // Cancela uno previo con el mismo id si lo hubiera
  const existing = tabTimers.get(alarm.id)
  if (existing) clearTimeout(existing)

  const delay = alarm.fireAt - Date.now()
  if (delay <= 0) {
    // Ya pasó; lanzamos ya
    fireNotificationLocally(alarm)
    return
  }

  // setTimeout solo permite ~24.8 días de delay (int32 ms). Aquí los pasos
  // máximos son 48h, pero por si acaso clampeamos.
  const safeDelay = Math.min(delay, 2_000_000_000)

  const handle = setTimeout(() => {
    fireNotificationLocally(alarm)
    tabTimers.delete(alarm.id)
    removeFromAlarms(alarm.id)
  }, safeDelay)
  tabTimers.set(alarm.id, handle)
}

function fireNotificationLocally(alarm: PassAlarm) {
  if (!isBrowser() || typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return

  // Si tenemos SW preferimos que él muestre la notificación (permite
  // mostrarla aunque la pestaña esté en background o cerrada en algunos
  // navegadores).
  navigator.serviceWorker?.ready
    .then(reg => {
      reg.showNotification(alarm.payload.title, {
        body: alarm.payload.body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: alarm.payload.tag,
        data: { url: alarm.payload.url },
        requireInteraction: false
      })
    })
    .catch(() => {
      // Sin SW, notificación clásica
      try {
        const n = new Notification(alarm.payload.title, {
          body: alarm.payload.body,
          icon: '/pwa-192x192.png',
          tag: alarm.payload.tag
        })
        n.onclick = () => {
          window.focus()
          window.location.href = alarm.payload.url
        }
      } catch {
        /* navegador sin soporte robusto */
      }
    })
}

function removeFromAlarms(id: string) {
  alarms.value = alarms.value.filter(a => a.id !== id)
  saveToStorage()
}

function reconcileAll() {
  // Re-programa todas las alarmas vigentes (limpia las pasadas).
  const now = Date.now()
  let changed = false
  alarms.value = alarms.value.filter(a => {
    if (a.fireAt <= now - 60_000) {
      // Ya pasó hace más de 1 min; descarta sin disparar
      changed = true
      return false
    }
    return true
  })
  if (changed) saveToStorage()

  for (const a of alarms.value) {
    // Le decimos al SW que la guarde/programe (idempotente)
    postToSw({ type: 'schedule-pass', alarm: a })
    // Y además programamos en la pestaña como respaldo
    scheduleTabTimer(a)
  }
}

function buildAlarm(passStartAt: number, leadMinutes: number, visible: boolean): PassAlarm {
  const fireAt = passStartAt - leadMinutes * 60 * 1000

  const dt = new Date(passStartAt)
  const hora = dt.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })

  return {
    id: `pass-${passStartAt}`,
    fireAt,
    passStartAt,
    leadMinutes,
    payload: {
      title: visible
        ? '🛰️ La ISS pasa pronto sobre ti'
        : '🛰️ Próximo paso de la ISS',
      body: visible
        ? `A las ${hora}. Será visible a simple vista.`
        : `A las ${hora}. Sólo con instrumentos.`,
      url: '/',
      tag: `iss-pass-${passStartAt}`
    }
  }
}

export function useIssNotifications() {
  // ---------- API pública ----------

  const isSupported = computed(() => {
    return permission.value !== 'unsupported'
  })

  const isGranted = computed(() => permission.value === 'granted')
  const isDenied = computed(() => permission.value === 'denied')

  /**
   * Pide permiso al usuario. Devuelve true si quedó concedido.
   */
  async function requestPermission(): Promise<boolean> {
    if (!isBrowser() || typeof Notification === 'undefined') {
      permission.value = 'unsupported'
      return false
    }
    if (Notification.permission === 'granted') {
      permission.value = 'granted'
      return true
    }
    if (Notification.permission === 'denied') {
      permission.value = 'denied'
      return false
    }
    try {
      const result = await Notification.requestPermission()
      permission.value = result
      return result === 'granted'
    } catch {
      permission.value = 'denied'
      return false
    }
  }

  /**
   * ¿Hay alarma activa para el paso que empieza en `passStartAt`?
   */
  function hasAlarmFor(passStartAt: number): boolean {
    return alarms.value.some(a => a.passStartAt === passStartAt)
  }

  function getAlarmFor(passStartAt: number): PassAlarm | undefined {
    return alarms.value.find(a => a.passStartAt === passStartAt)
  }

  /**
   * Programa una alarma para un paso. Devuelve la alarma o null si no se pudo.
   */
  async function scheduleForPass(opts: {
    passStartAt: number
    leadMinutes?: number   // por defecto 15
    visible?: boolean
  }): Promise<PassAlarm | null> {
    const lead = opts.leadMinutes ?? 15
    const granted = await requestPermission()
    if (!granted) return null

    const alarm = buildAlarm(opts.passStartAt, lead, opts.visible ?? false)

    // Si está en el pasado o demasiado cerca, no merece la pena
    if (alarm.fireAt <= Date.now() + 5_000) {
      return null
    }

    // Si ya había una alarma para este paso, la reemplazamos
    cancelForPass(opts.passStartAt)

    alarms.value = [...alarms.value, alarm]
    saveToStorage()

    postToSw({ type: 'schedule-pass', alarm })
    scheduleTabTimer(alarm)

    // Asegura que el SW está activo (registramos al cargar pwa.client.ts).
    await getServiceWorkerRegistration()

    return alarm
  }

  /**
   * Cancela la alarma asociada a un paso.
   */
  function cancelForPass(passStartAt: number) {
    const target = alarms.value.find(a => a.passStartAt === passStartAt)
    if (!target) return

    // Cancela timer local
    const t = tabTimers.get(target.id)
    if (t) {
      clearTimeout(t)
      tabTimers.delete(target.id)
    }

    // Quita del array y storage
    removeFromAlarms(target.id)

    // Avisa al SW
    postToSw({ type: 'cancel-pass', id: target.id })
  }

  function cancelAll() {
    for (const id of Array.from(tabTimers.keys())) {
      clearTimeout(tabTimers.get(id)!)
    }
    tabTimers.clear()

    const ids = alarms.value.map(a => a.id)
    alarms.value = []
    saveToStorage()
    for (const id of ids) {
      postToSw({ type: 'cancel-pass', id })
    }
  }

  // ---------- Ciclo de vida ----------

  let visibilityHandler: (() => void) | null = null

  onMounted(() => {
    refreshPermission()
    loadFromStorage()
    reconcileAll()

    // Cuando la pestaña vuelve a ser visible, re-comprobamos por si algún
    // timer murió (común en móvil con la pestaña en background).
    visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        loadFromStorage()
        reconcileAll()
        refreshPermission()
      }
    }
    document.addEventListener('visibilitychange', visibilityHandler)
  })

  onBeforeUnmount(() => {
    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler)
      visibilityHandler = null
    }
    // Mantenemos los timers vivos: queremos que disparen aunque el componente
    // se desmonte, por eso NO los limpiamos aquí.
  })

  return {
    alarms,
    permission,
    isSupported,
    isGranted,
    isDenied,
    requestPermission,
    hasAlarmFor,
    getAlarmFor,
    scheduleForPass,
    cancelForPass,
    cancelAll
  }
}
