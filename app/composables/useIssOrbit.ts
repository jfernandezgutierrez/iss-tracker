import { ref } from 'vue'
import * as satellite from 'satellite.js'

export interface OrbitPoint {
  latitude: number
  longitude: number
  timestamp: number
}

// Estado global: una sola instancia compartida entre los que usen el composable
const pastPath = ref<OrbitPoint[]>([])
const futurePath = ref<OrbitPoint[]>([])

const loadingOrbit = ref(false)
const errorOrbit = ref<string | null>(null)

// Tipamos como `any` para ser compatibles con v5 y v7 de satellite.js
// (el nombre del tipo ha cambiado entre versiones, pero la API runtime es idéntica).
let satrec: any = null
let tleFetchedAt = 0
let refreshInterval: ReturnType<typeof setInterval> | null = null

// Ventana temporal (en minutos): cuánto recorrido pasado y futuro mostramos
const PAST_MINUTES = 45
const FUTURE_MINUTES = 90
const STEP_SECONDS = 30

// Re-fetch del TLE cada 6h (son válidos varias horas)
const TLE_MAX_AGE_MS = 6 * 60 * 60 * 1000

// APIs públicas con CORS abierto. Probamos en orden hasta que una funcione.
// NORAD ID de la ISS (Zarya) = 25544.
const TLE_SOURCES: Array<() => Promise<{ line1: string; line2: string }>> = [
  // 1) API abierta de Ivan Stanojevic (CORS abierto, gratis, sin key)
  async () => {
    const data = await $fetch<{ line1: string; line2: string }>(
      'https://tle.ivanstanojevic.me/api/tle/25544'
    )
    return { line1: data.line1, line2: data.line2 }
  },
  // 2) Wheretheiss.at — también expone TLE con CORS abierto como fallback
  async () => {
    const data = await $fetch<{ tle: string }>(
      'https://api.wheretheiss.at/v1/satellites/25544/tles?format=json'
    )
    const lines = (data.tle || '')
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
    const line1 = lines.find(l => l.startsWith('1 ')) || ''
    const line2 = lines.find(l => l.startsWith('2 ')) || ''
    return { line1, line2 }
  }
]

async function fetchAndParseTle() {
  let lastError: any = null

  for (const source of TLE_SOURCES) {
    try {
      const { line1, line2 } = await source()
      if (!line1 || !line2) {
        throw new Error('TLE vacío o malformado')
      }
      satrec = satellite.twoline2satrec(line1, line2)
      tleFetchedAt = Date.now()
      // eslint-disable-next-line no-console
      console.info('[useIssOrbit] TLE cargado correctamente')
      return
    } catch (err) {
      lastError = err
      // eslint-disable-next-line no-console
      console.warn('[useIssOrbit] Fuente TLE fallida, probando siguiente:', err)
    }
  }

  throw lastError || new Error('No se pudo obtener el TLE de ninguna fuente')
}

function propagateAt(date: Date): OrbitPoint | null {
  if (!satrec) return null

  const posVel = satellite.propagate(satrec, date)
  const eci = posVel.position
  if (!eci || typeof eci === 'boolean') return null

  const gmst = satellite.gstime(date)
  const geodetic = satellite.eciToGeodetic(eci as any, gmst)

  return {
    latitude: satellite.degreesLat(geodetic.latitude),
    longitude: satellite.degreesLong(geodetic.longitude),
    timestamp: date.getTime()
  }
}

function recomputePaths() {
  if (!satrec) return

  const now = Date.now()
  const past: OrbitPoint[] = []
  const future: OrbitPoint[] = []

  const stepMs = STEP_SECONDS * 1000

  // Pasado (de -PAST_MINUTES a ahora)
  for (let t = -PAST_MINUTES * 60 * 1000; t <= 0; t += stepMs) {
    const point = propagateAt(new Date(now + t))
    if (point) past.push(point)
  }

  // Futuro (de ahora a +FUTURE_MINUTES)
  for (let t = stepMs; t <= FUTURE_MINUTES * 60 * 1000; t += stepMs) {
    const point = propagateAt(new Date(now + t))
    if (point) future.push(point)
  }

  // Reasignamos creando nuevas referencias de array para garantizar que los
  // watchers reactivos (sin deep) detecten el cambio.
  pastPath.value = [...past]
  futurePath.value = [...future]

  // eslint-disable-next-line no-console
  console.info(
    `[useIssOrbit] Órbita recalculada — past: ${past.length} puntos, future: ${future.length} puntos`
  )
}

export function useIssOrbit() {
  async function loadOrbit() {
    loadingOrbit.value = true
    errorOrbit.value = null

    try {
      const needsTleFetch = !satrec || Date.now() - tleFetchedAt > TLE_MAX_AGE_MS
      if (needsTleFetch) {
        await fetchAndParseTle()
      }
      recomputePaths()
    } catch (error: any) {
      errorOrbit.value = error?.message || 'No se pudo cargar la órbita'
      // eslint-disable-next-line no-console
      console.error('[useIssOrbit] Error cargando la órbita:', error)
    } finally {
      loadingOrbit.value = false
    }
  }

  function startOrbitRefresh(ms = 30_000) {
    stopOrbitRefresh()
    refreshInterval = setInterval(() => {
      // Re-propagamos con el tiempo actual (así el tramo pasado/futuro se desplaza)
      if (Date.now() - tleFetchedAt > TLE_MAX_AGE_MS) {
        // TLE caducado → refetch
        loadOrbit()
      } else {
        recomputePaths()
      }
    }, ms)
  }

  function stopOrbitRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  }

  return {
    pastPath,
    futurePath,
    loadingOrbit,
    errorOrbit,
    loadOrbit,
    startOrbitRefresh,
    stopOrbitRefresh
  }
}

/**
 * Devuelve el satrec actual, cargándolo si hiciera falta.
 * Lo usamos desde la predicción de pasos para no duplicar fetches del TLE.
 */
export async function ensureSatrec(): Promise<any> {
  const stale = !satrec || Date.now() - tleFetchedAt > TLE_MAX_AGE_MS
  if (stale) {
    await fetchAndParseTle()
  }
  return satrec
}

/**
 * Trocea un path cuando cruza el antimeridiano (±180° longitud) para que
 * Leaflet no dibuje una línea atravesando todo el mapa horizontalmente.
 */
export function splitOnAntimeridian(points: OrbitPoint[]): OrbitPoint[][] {
  if (points.length === 0) return []

  const segments: OrbitPoint[][] = []
  let current: OrbitPoint[] = [points[0]!]

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!
    const curr = points[i]!

    if (Math.abs(curr.longitude - prev.longitude) > 180) {
      segments.push(current)
      current = [curr]
    } else {
      current.push(curr)
    }
  }

  if (current.length > 0) {
    segments.push(current)
  }

  return segments
}
