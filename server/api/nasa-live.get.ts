/**
 * Devuelve los directos actuales y próximos del canal oficial de NASA en YouTube.
 *
 * Estrategia:
 *  1) Descargamos https://www.youtube.com/@NASA/streams (página de directos).
 *  2) Localizamos el bloque `ytInitialData` que YouTube embebe en el HTML.
 *     YouTube usa dos patrones: `var ytInitialData = {...};` o
 *     `window["ytInitialData"] = {...};`. Probamos ambos.
 *  3) Recorremos el JSON buscando videoRenderers con overlay LIVE o UPCOMING.
 *  4) Si no podemos parsear, caemos a un regex directo sobre el HTML buscando
 *     bloques con LIVE/UPCOMING y extrayendo videoId + título.
 *  5) Cache de 2 minutos.
 */

export interface NasaLiveItem {
  id: string
  videoId: string
  title: string
  description: string
  status: 'live' | 'upcoming'
  thumbnailUrl: string
  scheduledStartTime?: string
  viewCountText?: string
}

interface CacheEntry {
  data: NasaLiveItem[]
  fetchedAt: number
  source: 'ytInitialData' | 'regex-fallback'
}

let cache: CacheEntry | null = null
const CACHE_TTL_MS = 2 * 60 * 1000

const STREAMS_URL = 'https://www.youtube.com/@NASA/streams'

/**
 * Extrae el JSON ytInitialData probando las variantes conocidas.
 */
function extractYtInitialData(html: string): any | null {
  const patterns = [
    'var ytInitialData = ',
    'window["ytInitialData"] = ',
    'ytInitialData = '
  ]

  for (const marker of patterns) {
    const start = html.indexOf(marker)
    if (start === -1) continue

    const jsonStart = start + marker.length
    const parsed = parseBalancedJson(html, jsonStart)
    if (parsed) return parsed
  }

  return null
}

function parseBalancedJson(source: string, startIndex: number): any | null {
  // La cadena debe empezar en '{'
  // (YouTube a veces añade espacio entre `=` y `{`, lo saltamos)
  let i = startIndex
  while (i < source.length && source[i] !== '{') i++
  if (i >= source.length) return null

  let depth = 0
  let inString = false
  let escaped = false

  for (let j = i; j < source.length; j++) {
    const ch = source[j]

    if (escaped) {
      escaped = false
      continue
    }
    if (ch === '\\') {
      escaped = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (inString) continue

    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        const raw = source.slice(i, j + 1)
        try {
          return JSON.parse(raw)
        } catch {
          return null
        }
      }
    }
  }

  return null
}

function detectStatus(videoRenderer: any): 'live' | 'upcoming' | null {
  const overlays = videoRenderer.thumbnailOverlays ?? []
  for (const overlay of overlays) {
    const style = overlay?.thumbnailOverlayTimeStatusRenderer?.style
    if (style === 'LIVE') return 'live'
    if (style === 'UPCOMING') return 'upcoming'
  }

  const badges = videoRenderer.badges ?? []
  for (const b of badges) {
    const label = b?.metadataBadgeRenderer?.label?.toString().toLowerCase() ?? ''
    if (label.includes('live') || label.includes('directo')) return 'live'
  }

  return null
}

function collectLiveAndUpcoming(
  node: any,
  out: NasaLiveItem[],
  seen: Set<string>
): void {
  if (!node || typeof node !== 'object') return

  if (Array.isArray(node)) {
    for (const child of node) collectLiveAndUpcoming(child, out, seen)
    return
  }

  if (node.videoRenderer) {
    const v = node.videoRenderer
    const videoId: string | undefined = v.videoId

    if (videoId && !seen.has(videoId)) {
      const status = detectStatus(v)
      if (status) {
        const title =
          v.title?.runs?.[0]?.text ??
          v.title?.simpleText ??
          'Directo NASA'

        const description =
          v.descriptionSnippet?.runs?.map((r: any) => r.text).join('') ??
          v.detailedMetadataSnippets?.[0]?.snippetText?.runs
            ?.map((r: any) => r.text)
            .join('') ??
          ''

        const thumbs = v.thumbnail?.thumbnails ?? []
        const thumbnailUrl = thumbs[thumbs.length - 1]?.url ?? ''

        const scheduledEpoch =
          v.upcomingEventData?.startTime ??
          v.upcomingEventData?.scheduledStartTime

        const scheduledStartTime = scheduledEpoch
          ? new Date(Number(scheduledEpoch) * 1000).toISOString()
          : undefined

        const viewCountText =
          v.viewCountText?.runs?.map((r: any) => r.text).join('') ??
          v.viewCountText?.simpleText ??
          v.shortViewCountText?.simpleText ??
          undefined

        seen.add(videoId)
        out.push({
          id: videoId,
          videoId,
          title: title.trim(),
          description: description.trim(),
          status,
          thumbnailUrl,
          scheduledStartTime,
          viewCountText
        })
      }
    }
  }

  for (const key of Object.keys(node)) {
    collectLiveAndUpcoming(node[key], out, seen)
  }
}

/**
 * Fallback: si no pudimos parsear ytInitialData, escaneamos el HTML crudo
 * buscando bloques donde aparezca "style":"LIVE" o "style":"UPCOMING" y
 * extraemos el videoId y título más cercanos.
 */
function regexFallback(html: string): NasaLiveItem[] {
  const items: NasaLiveItem[] = []
  const seen = new Set<string>()

  // Busca { ... videoId:"xxxx" ... style:"LIVE"/"UPCOMING" ... title:{...} }
  // Estrategia simple: por cada ocurrencia de "style":"LIVE" / "UPCOMING",
  // retrocedemos hasta encontrar "videoId":"..." cercano (<= 4000 chars atrás).
  const statusRegex = /"style":"(LIVE|UPCOMING)"/g

  let match: RegExpExecArray | null
  while ((match = statusRegex.exec(html)) !== null) {
    const statusWord = match[1] as 'LIVE' | 'UPCOMING'
    const status: 'live' | 'upcoming' = statusWord === 'LIVE' ? 'live' : 'upcoming'

    const windowStart = Math.max(0, match.index - 4000)
    const window = html.slice(windowStart, match.index)

    // videoId más reciente dentro de la ventana
    const videoIdMatches = [...window.matchAll(/"videoId":"([\w-]{8,})"/g)]
    if (videoIdMatches.length === 0) continue
    const videoId = videoIdMatches[videoIdMatches.length - 1]![1]!
    if (seen.has(videoId)) continue

    // Título más reciente: buscamos simpleText o primer run.text
    let title = 'Directo NASA'
    const titleSimple = [...window.matchAll(/"title":\{"simpleText":"([^"]+)"/g)]
    const titleRuns = [...window.matchAll(/"title":\{"runs":\[\{"text":"([^"]+)"/g)]
    const lastTitle =
      titleSimple[titleSimple.length - 1] || titleRuns[titleRuns.length - 1]
    if (lastTitle) title = JSON.parse(`"${lastTitle[1]}"`)

    // Miniatura: url de mayor resolución cercana
    const thumbMatches = [
      ...window.matchAll(/"url":"(https:\/\/i\.ytimg\.com\/[^"]+)"/g)
    ]
    const thumbnailUrl = thumbMatches[thumbMatches.length - 1]?.[1]?.replace(/\\u0026/g, '&') || ''

    // startTime para upcoming
    let scheduledStartTime: string | undefined
    const startTimeMatch = window.match(/"startTime":"?(\d{9,12})"?/)
    if (startTimeMatch) {
      scheduledStartTime = new Date(Number(startTimeMatch[1]) * 1000).toISOString()
    }

    seen.add(videoId)
    items.push({
      id: videoId,
      videoId,
      title,
      description: '',
      status,
      thumbnailUrl,
      scheduledStartTime
    })
  }

  return items
}

function sortItems(items: NasaLiveItem[]): NasaLiveItem[] {
  return [...items].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'live' ? -1 : 1
    if (a.status === 'upcoming' && b.status === 'upcoming') {
      const ta = a.scheduledStartTime ? Date.parse(a.scheduledStartTime) : Infinity
      const tb = b.scheduledStartTime ? Date.parse(b.scheduledStartTime) : Infinity
      return ta - tb
    }
    return 0
  })
}

async function fetchNasaStreams(): Promise<{
  items: NasaLiveItem[]
  source: CacheEntry['source']
}> {
  const html = await $fetch<string>(STREAMS_URL, {
    responseType: 'text',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  })

  const data = extractYtInitialData(html)

  if (data) {
    const items: NasaLiveItem[] = []
    const seen = new Set<string>()
    collectLiveAndUpcoming(data, items, seen)

    if (items.length > 0) {
      return { items: sortItems(items), source: 'ytInitialData' }
    }
  }

  // Fallback por regex si el parser no encontró nada
  const fallbackItems = regexFallback(html)
  if (fallbackItems.length > 0) {
    return { items: sortItems(fallbackItems), source: 'regex-fallback' }
  }

  // No hay directos y tampoco pudimos parsear — devolvemos vacío pero sin error.
  // (Puede ser legítimo: la NASA no siempre tiene LIVE/UPCOMING simultáneos.)
  return { items: [], source: data ? 'ytInitialData' : 'regex-fallback' }
}

export default defineEventHandler(async () => {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return {
      items: cache.data,
      cached: true,
      fetchedAt: cache.fetchedAt,
      source: cache.source
    }
  }

  try {
    const { items, source } = await fetchNasaStreams()
    cache = { data: items, fetchedAt: Date.now(), source }
    return { items, cached: false, fetchedAt: cache.fetchedAt, source }
  } catch (error: any) {
    if (cache) {
      return {
        items: cache.data,
        cached: true,
        stale: true,
        fetchedAt: cache.fetchedAt,
        source: cache.source,
        error: error?.message || 'Error obteniendo directos'
      }
    }
    throw createError({
      statusCode: 502,
      statusMessage: `No se pudieron obtener los directos de la NASA: ${error?.message || 'error desconocido'}`
    })
  }
})
