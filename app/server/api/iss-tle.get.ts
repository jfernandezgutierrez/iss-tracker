/**
 * Devuelve el TLE (Two-Line Element) de la ISS desde Celestrak.
 * Se hace en el servidor para evitar problemas de CORS.
 *
 * Los TLE cambian poco (horas), así que cachea durante 1 hora.
 */

let cache: { line1: string; line2: string; fetchedAt: number } | null = null
const CACHE_TTL_MS = 60 * 60 * 1000

const TLE_URL = 'https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE'

export default defineEventHandler(async () => {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return { line1: cache.line1, line2: cache.line2, cached: true }
  }

  try {
    const text = await $fetch<string>(TLE_URL, { responseType: 'text' })

    const lines = String(text)
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)

    const line1 = lines.find(l => l.startsWith('1 ')) || ''
    const line2 = lines.find(l => l.startsWith('2 ')) || ''

    if (!line1 || !line2) {
      throw new Error('TLE malformado')
    }

    cache = { line1, line2, fetchedAt: Date.now() }

    return { line1, line2, cached: false }
  } catch (error: any) {
    if (cache) {
      // Si falla la red pero tenemos caché, devuelve la caché aunque esté vencida
      return { line1: cache.line1, line2: cache.line2, cached: true, stale: true }
    }
    throw createError({
      statusCode: 502,
      statusMessage: `No se pudo obtener el TLE: ${error?.message || 'error desconocido'}`
    })
  }
})
