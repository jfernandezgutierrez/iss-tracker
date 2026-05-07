import { ref } from 'vue'

/**
 * Detecta directos actuales y próximos del canal oficial de la NASA en YouTube,
 * haciendo scraping de la página /streams a través de proxies públicos con CORS.
 *
 * Esto funciona desde sitios estáticos (Nuxt generate) porque toda la lógica
 * corre en cliente. Si todos los proxies fallan caemos a unos directos "evergreen"
 * para que la página nunca quede completamente vacía.
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

// Streams estables (siempre en directo desde la ISS). Se usan como último fallback.
const EVERGREEN_STREAMS: NasaLiveItem[] = [
  {
    id: 'sWasdbDVNvc',
    videoId: 'sWasdbDVNvc',
    title: 'ISS en directo — vistas de la Tierra',
    description:
      'Cámaras exteriores de la Estación Espacial Internacional mostrando la Tierra.',
    status: 'live',
    thumbnailUrl: 'https://i.ytimg.com/vi/sWasdbDVNvc/hqdefault_live.jpg'
  },
  {
    id: '21X5lGlDOfg',
    videoId: '21X5lGlDOfg',
    title: 'NASA TV — Canal público',
    description:
      'Cobertura en directo 24/7 del canal público de NASA: misiones, eventos y contenidos educativos.',
    status: 'live',
    thumbnailUrl: 'https://i.ytimg.com/vi/21X5lGlDOfg/hqdefault_live.jpg'
  }
]

const STREAMS_URL = 'https://www.youtube.com/@NASA/streams'

// Lista ordenada de proxies CORS públicos. Funcionan como GET simple sobre una URL.
const CORS_PROXIES = [
  (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`
]

// ================== Parsing ==================

function extractYtInitialData(html: string): any | null {
  const patterns = [
    'var ytInitialData = ',
    'window["ytInitialData"] = ',
    'ytInitialData = '
  ]

  for (const marker of patterns) {
    const start = html.indexOf(marker)
    if (start === -1) continue

    let i = start + marker.length
    while (i < html.length && html[i] !== '{') i++
    if (i >= html.length) continue

    let depth = 0
    let inString = false
    let escaped = false

    for (let j = i; j < html.length; j++) {
      const ch = html[j]
      if (escaped) { escaped = false; continue }
      if (ch === '\\') { escaped = true; continue }
      if (ch === '"') { inString = !inString; continue }
      if (inString) continue

      if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) {
          try {
            return JSON.parse(html.slice(i, j + 1))
          } catch {
            break
          }
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

function collectLiveAndUpcoming(node: any, out: NasaLiveItem[], seen: Set<string>): void {
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

function regexFallback(html: string): NasaLiveItem[] {
  const items: NasaLiveItem[] = []
  const seen = new Set<string>()
  const statusRegex = /"style":"(LIVE|UPCOMING)"/g

  let match: RegExpExecArray | null
  while ((match = statusRegex.exec(html)) !== null) {
    const statusWord = match[1] as 'LIVE' | 'UPCOMING'
    const status: 'live' | 'upcoming' = statusWord === 'LIVE' ? 'live' : 'upcoming'

    const windowStart = Math.max(0, match.index - 4000)
    const windowStr = html.slice(windowStart, match.index)

    const videoIdMatches = [...windowStr.matchAll(/"videoId":"([\w-]{8,})"/g)]
    if (videoIdMatches.length === 0) continue
    const videoId = videoIdMatches[videoIdMatches.length - 1]![1]!
    if (seen.has(videoId)) continue

    let title = 'Directo NASA'
    const titleSimple = [...windowStr.matchAll(/"title":\{"simpleText":"([^"]+)"/g)]
    const titleRuns = [...windowStr.matchAll(/"title":\{"runs":\[\{"text":"([^"]+)"/g)]
    const lastTitle =
      titleSimple[titleSimple.length - 1] || titleRuns[titleRuns.length - 1]
    if (lastTitle) {
      try { title = JSON.parse(`"${lastTitle[1]}"`) } catch { /* noop */ }
    }

    const thumbMatches = [...windowStr.matchAll(/"url":"(https:\/\/i\.ytimg\.com\/[^"]+)"/g)]
    const thumbnailUrl =
      thumbMatches[thumbMatches.length - 1]?.[1]?.replace(/\\u0026/g, '&') || ''

    let scheduledStartTime: string | undefined
    const startTimeMatch = windowStr.match(/"startTime":"?(\d{9,12})"?/)
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

async function fetchHtmlViaProxies(): Promise<string> {
  let lastError: any = null

  for (const buildProxyUrl of CORS_PROXIES) {
    try {
      const proxied = buildProxyUrl(STREAMS_URL)
      const res = await fetch(proxied, {
        headers: { 'Accept': 'text/html' }
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const html = await res.text()
      if (!html || html.length < 1000) {
        throw new Error('Respuesta vacía del proxy')
      }
      return html
    } catch (err) {
      lastError = err
      // eslint-disable-next-line no-console
      console.warn('[useNasaLive] Proxy CORS falló, probando siguiente:', err)
    }
  }

  throw lastError || new Error('Todos los proxies fallaron')
}

// ================== Composable ==================

const items = ref<NasaLiveItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const lastFetchedAt = ref<number | null>(null)
const usingFallback = ref(false)

export function useNasaLive() {
  async function loadNasaLive(silent = false) {
    if (!silent) {
      loading.value = true
    }
    error.value = null

    try {
      const html = await fetchHtmlViaProxies()

      let parsed: NasaLiveItem[] = []
      const data = extractYtInitialData(html)
      if (data) {
        collectLiveAndUpcoming(data, parsed, new Set())
      }
      if (parsed.length === 0) {
        parsed = regexFallback(html)
      }

      items.value = sortItems(parsed)
      usingFallback.value = false
      lastFetchedAt.value = Date.now()

      // eslint-disable-next-line no-console
      console.info(`[useNasaLive] ${items.value.length} stream(s) detectados`)
    } catch (err: any) {
      error.value = err?.message || 'No se pudieron cargar los directos'
      // eslint-disable-next-line no-console
      console.error('[useNasaLive] Error:', err)

      // Si no tenemos nada, devolvemos los evergreen para que la UI no quede vacía.
      if (items.value.length === 0) {
        items.value = [...EVERGREEN_STREAMS]
        usingFallback.value = true
        lastFetchedAt.value = Date.now()
      }
    } finally {
      loading.value = false
    }
  }

  return {
    items,
    loading,
    error,
    lastFetchedAt,
    usingFallback,
    loadNasaLive
  }
}
