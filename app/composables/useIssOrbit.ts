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

let satrec: satellite.SatRec | null = null
let tleFetchedAt = 0
let refreshInterval: ReturnType<typeof setInterval> | null = null

// Ventana temporal (en minutos): cuánto recorrido pasado y futuro mostramos
const PAST_MINUTES = 45
const FUTURE_MINUTES = 90
const STEP_SECONDS = 30

// Re-fetch del TLE cada 6h (son válidos varias horas)
const TLE_MAX_AGE_MS = 6 * 60 * 60 * 1000

async function fetchAndParseTle() {
  const { line1, line2 } = await $fetch<{ line1: string; line2: string }>('/api/iss-tle')
  if (!line1 || !line2) {
    throw new Error('TLE vacío recibido del servidor')
  }
  satrec = satellite.twoline2satrec(line1, line2)
  tleFetchedAt = Date.now()
  // eslint-disable-next-line no-console
  console.info('[useIssOrbit] TLE cargado correctamente')
}

function propagateAt(date: Date): OrbitPoint | null {
  if (!satrec) return null

  const posVel = satellite.propagate(satrec, date)
  const eci = posVel.position
  if (!eci || typeof eci === 'boolean') return null

  const gmst = satellite.gstime(date)
  const geodetic = satellite.eciToGeodetic(eci as satellite.EciVec3<number>, gmst)

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
