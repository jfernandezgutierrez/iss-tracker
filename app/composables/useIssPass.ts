import { ref } from 'vue'
import * as satellite from 'satellite.js'
import SunCalc from 'suncalc'
import { ensureSatrec } from './useIssOrbit'

/**
 * Predice los próximos pasos reales de la ISS sobre unas coordenadas dadas.
 *
 * Funciona 100% en cliente: usa el satrec del TLE (ya compartido con useIssOrbit)
 * y propaga la posición con satellite.js. Un paso empieza cuando la elevación
 * del satélite sobre el horizonte cruza MIN_ELEVATION subiendo, y termina
 * cuando vuelve a cruzar bajando.
 *
 * "Visible a ojo" exige dos condiciones a la vez:
 *   a) El observador esté en penumbra/noche (sol por debajo de -6°).
 *   b) La ISS esté iluminada por el sol (no dentro de la sombra de la Tierra).
 */

export interface PassPrediction {
  startTime: number        // epoch ms — cuando asoma por el horizonte
  endTime: number          // epoch ms — cuando se pone
  peakTime: number         // epoch ms — apogeo (máxima elevación)
  duration: number         // segundos totales
  maxElevation: number     // grados
  startAzimuth: number     // grados (0=N, 90=E, 180=S, 270=O)
  endAzimuth: number       // grados
  visible: boolean         // visible a simple vista
}

// Elevación mínima que consideramos "paso" (10° — por debajo está la atmósfera sucia)
const MIN_ELEVATION = 10
// Paso de muestreo coarse (30 s) para detectar los tramos del paso
const STEP_SECONDS = 30
// Cuando detectamos el inicio/fin refinamos con pasos de 1 s
const REFINE_SECONDS = 1
// Ventana de predicción: 48 h por defecto
const DEFAULT_WINDOW_HOURS = 48

const loading = ref(false)
const error = ref<string | null>(null)
const passes = ref<PassPrediction[]>([])

interface LookAngle {
  elevation: number
  azimuth: number
  rangeKm: number
}

/**
 * Ángulo del satélite visto desde el observador (en grados).
 * Devuelve null si no se puede propagar.
 */
function lookAngleAt(
  satrec: any,
  observerGd: any,
  date: Date
): { look: LookAngle; satEci: any } | null {
  const posVel = satellite.propagate(satrec, date)
  const eci = posVel.position
  if (!eci || typeof eci === 'boolean') return null

  const gmst = satellite.gstime(date)
  const ecf = satellite.eciToEcf(eci as any, gmst)
  const look = satellite.ecfToLookAngles(observerGd, ecf)

  return {
    look: {
      elevation: satellite.radiansToDegrees(look.elevation),
      azimuth: satellite.radiansToDegrees(look.azimuth),
      rangeKm: look.rangeSat
    },
    satEci: eci
  }
}

/**
 * ¿Está la ISS iluminada por el sol en este instante?
 * La ISS está en sombra cuando el ángulo Sol-Tierra-Sat > 90° y la distancia
 * perpendicular del satélite al eje Sol-Tierra es menor que el radio terrestre.
 */
function isSatelliteLit(satEci: any, date: Date): boolean {
  // Vector Sol→Tierra aproximado con SunCalc (el Sol visto desde 0,0 nos da la
  // dirección angular; para iluminación de satélite nos basta el vector unitario
  // Tierra→Sol en coordenadas inerciales aproximadas).
  // Usamos la posición del sol en ECI aproximada calculando longitud media.
  const n = (date.getTime() / 86400000) - 10957.5 // días desde J2000
  const L = (280.460 + 0.9856474 * n) * Math.PI / 180
  const g = (357.528 + 0.9856003 * n) * Math.PI / 180
  const lambda = L + (1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * Math.PI / 180
  const epsilon = 23.439 * Math.PI / 180

  // Distancia Sol-Tierra (km) ~ 1 UA
  const AU = 149597870.7
  const sunEci = {
    x: AU * Math.cos(lambda),
    y: AU * Math.cos(epsilon) * Math.sin(lambda),
    z: AU * Math.sin(epsilon) * Math.sin(lambda)
  }

  // Vector unitario Tierra→Sol
  const sunMag = Math.sqrt(sunEci.x ** 2 + sunEci.y ** 2 + sunEci.z ** 2)
  const sunUnit = { x: sunEci.x / sunMag, y: sunEci.y / sunMag, z: sunEci.z / sunMag }

  // Proyección escalar del satélite sobre el eje Tierra→Sol
  const dot = satEci.x * sunUnit.x + satEci.y * sunUnit.y + satEci.z * sunUnit.z

  // Si la proyección es positiva, el satélite está del lado del Sol → iluminado
  if (dot > 0) return true

  // Si es negativa, puede estar en sombra; distancia perpendicular al eje
  const perpX = satEci.x - dot * sunUnit.x
  const perpY = satEci.y - dot * sunUnit.y
  const perpZ = satEci.z - dot * sunUnit.z
  const perp = Math.sqrt(perpX ** 2 + perpY ** 2 + perpZ ** 2)

  const EARTH_RADIUS = 6378
  // Si la perpendicular es mayor que el radio terrestre, pasa por fuera del
  // cono de sombra y sigue iluminada.
  return perp > EARTH_RADIUS
}

/**
 * ¿El observador está en penumbra/noche? (Sol por debajo de -6° = crepúsculo civil)
 */
function isObserverInTwilight(latitude: number, longitude: number, date: Date): boolean {
  const sunPos = SunCalc.getPosition(date, latitude, longitude)
  const sunElevationDeg = sunPos.altitude * 180 / Math.PI
  return sunElevationDeg < -6
}

/**
 * Refina el instante exacto en el que la elevación cruza el umbral.
 * Dada una ventana [t1, t2] donde sabemos que hubo cruce, hace un barrido de 1s.
 */
function refineCrossing(
  satrec: any,
  observerGd: any,
  t1: number,
  t2: number,
  direction: 'up' | 'down'
): number {
  let best = direction === 'up' ? t2 : t1
  const stepMs = REFINE_SECONDS * 1000

  for (let t = t1; t <= t2; t += stepMs) {
    const data = lookAngleAt(satrec, observerGd, new Date(t))
    if (!data) continue

    if (direction === 'up' && data.look.elevation >= MIN_ELEVATION) {
      return t
    }
    if (direction === 'down' && data.look.elevation < MIN_ELEVATION) {
      return t
    }
  }
  return best
}

export function useIssPass() {
  /**
   * Calcula los próximos pasos de la ISS sobre (lat, lon).
   * @param maxResults  máximo de pasos a devolver
   * @param windowHours ventana horaria a examinar
   */
  async function predictPasses(
    latitudeDeg: number,
    longitudeDeg: number,
    maxResults = 5,
    windowHours = DEFAULT_WINDOW_HOURS
  ) {
    loading.value = true
    error.value = null
    passes.value = []

    try {
      const satrec = await ensureSatrec()
      if (!satrec) throw new Error('No se pudo obtener el TLE de la ISS')

      const observerGd = {
        latitude: satellite.degreesToRadians(latitudeDeg),
        longitude: satellite.degreesToRadians(longitudeDeg),
        height: 0.01 // km sobre nivel del mar
      }

      const now = Date.now()
      const endTime = now + windowHours * 3600 * 1000
      const stepMs = STEP_SECONDS * 1000

      const found: PassPrediction[] = []

      let inPass = false
      let passStartMs = 0
      let passPeakElev = 0
      let passPeakMs = 0
      let passStartAz = 0
      let passVisibleAny = false

      let prevElevation = -90
      let prevTime = now

      for (let t = now; t <= endTime && found.length < maxResults; t += stepMs) {
        const date = new Date(t)
        const data = lookAngleAt(satrec, observerGd, date)
        if (!data) continue

        const { elevation, azimuth } = data.look

        // ---- Detección de inicio de paso (cruce al alza) ----
        if (!inPass && prevElevation < MIN_ELEVATION && elevation >= MIN_ELEVATION) {
          const startMs = refineCrossing(satrec, observerGd, prevTime, t, 'up')

          // Azimut en el momento exacto del inicio refinado
          const startData = lookAngleAt(satrec, observerGd, new Date(startMs))
          passStartAz = startData?.look.azimuth ?? azimuth
          passStartMs = startMs
          passPeakElev = elevation
          passPeakMs = t
          passVisibleAny = false
          inPass = true
        }

        if (inPass) {
          // Apogeo
          if (elevation > passPeakElev) {
            passPeakElev = elevation
            passPeakMs = t
          }

          // Visibilidad: ¿observador en penumbra Y satélite iluminado?
          const observerTwilight = isObserverInTwilight(latitudeDeg, longitudeDeg, date)
          const satLit = isSatelliteLit(data.satEci, date)
          if (observerTwilight && satLit) {
            passVisibleAny = true
          }

          // ---- Detección de fin de paso (cruce a la baja) ----
          if (prevElevation >= MIN_ELEVATION && elevation < MIN_ELEVATION) {
            const endMs = refineCrossing(satrec, observerGd, prevTime, t, 'down')
            const endData = lookAngleAt(satrec, observerGd, new Date(endMs))
            const endAz = endData?.look.azimuth ?? azimuth

            found.push({
              startTime: passStartMs,
              endTime: endMs,
              peakTime: passPeakMs,
              duration: Math.max(1, Math.round((endMs - passStartMs) / 1000)),
              maxElevation: Math.round(passPeakElev * 10) / 10,
              startAzimuth: Math.round(passStartAz),
              endAzimuth: Math.round(endAz),
              visible: passVisibleAny
            })

            inPass = false
          }
        }

        prevElevation = elevation
        prevTime = t
      }

      passes.value = found
    } catch (err: any) {
      error.value = err?.message || 'No se pudo calcular el próximo paso'
      // eslint-disable-next-line no-console
      console.error('[useIssPass] Error:', err)
    } finally {
      loading.value = false
    }
  }

  return {
    passes,
    loading,
    error,
    predictPasses
  }
}

/**
 * Convierte grados de azimut en una dirección cardinal (N, NE, E…).
 */
export function azimuthToCardinal(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO']
  const idx = Math.round(((deg % 360) / 45)) % 8
  return dirs[idx] ?? 'N'
}
