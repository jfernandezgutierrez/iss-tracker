/* ISS Tracker — Service Worker
 * Estrategia:
 *  - Shell HTML: network-first con fallback a caché (offline básico).
 *  - Assets de Nuxt (_nuxt/*): cache-first (tienen hash en el nombre).
 *  - Iconos / OG / manifest: cache-first.
 *  - Tiles del mapa (OSM/CARTO): cache-first con expiración.
 *  - APIs en vivo (TLE, NASA, ISS-now, who's-in-space): network-only.
 */

const VERSION = 'iss-tracker-v2';
const SHELL_CACHE = `shell-${VERSION}`;
const ASSETS_CACHE = `assets-${VERSION}`;
const TILES_CACHE = `tiles-${VERSION}`;

const PRECACHE_URLS = [
    '/',
    '/tripulacion',
    '/directos',
    '/contact',
    '/privacy-policy',
    '/manifest.webmanifest',
    '/iss-icon.svg',
    '/og-image.png',
    '/pwa-192x192.png',
    '/pwa-512x512.png',
    '/maskable-icon-512x512.png',
    '/apple-touch-icon.png'
];

const TILE_HOSTS = [
    'tile.openstreetmap.org',
    'a.tile.openstreetmap.org',
    'b.tile.openstreetmap.org',
    'c.tile.openstreetmap.org',
    'basemaps.cartocdn.com',
    'a.basemaps.cartocdn.com',
    'b.basemaps.cartocdn.com',
    'c.basemaps.cartocdn.com',
    'd.basemaps.cartocdn.com'
];

// Hosts/rutas cuya respuesta NO queremos cachear (siempre fresco)
const LIVE_HOSTS = [
    'tle.ivanstanojevic.me',
    'api.wheretheiss.at',
    'api.open-notify.org',
    'corsproxy.io',
    'api.allorigins.win'
];

// Tiles: máx 7 días en caché
const TILE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(SHELL_CACHE);
        // addAll falla en bloque si una sola URL falla — usamos add individual con tolerancia
        await Promise.all(PRECACHE_URLS.map((url) =>
            cache.add(url).catch(() => {
                // No fallamos el install si algún recurso aún no existe en build
                // eslint-disable-next-line no-console
                console.warn('[sw] No se pudo precachear', url);
            })
        ));
        self.skipWaiting();
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        // Borra cachés de versiones anteriores
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => {
            if (![SHELL_CACHE, ASSETS_CACHE, TILES_CACHE].includes(key)) {
                return caches.delete(key);
            }
            return null;
        }));
        await self.clients.claim();
    })());
});

function isTileRequest(url) {
    return TILE_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith('.' + host));
}

function isLiveApiRequest(url) {
    return LIVE_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith('.' + host));
}

function isNuxtAsset(url) {
    return url.origin === self.location.origin && url.pathname.startsWith('/_nuxt/');
}

function isStaticIcon(url) {
    if (url.origin !== self.location.origin) return false;
    return /\.(png|jpg|jpeg|webp|svg|ico|webmanifest)$/i.test(url.pathname);
}

function isHtmlNavigation(request, url) {
    if (request.mode === 'navigate') return true;
    const accept = request.headers.get('accept') || '';
    if (accept.includes('text/html') && url.origin === self.location.origin) return true;
    return false;
}

async function networkFirstHtml(request) {
    const cache = await caches.open(SHELL_CACHE);
    try {
        const fresh = await fetch(request);
        if (fresh && fresh.ok) {
            cache.put(request, fresh.clone()).catch(() => {});
        }
        return fresh;
    } catch (err) {
        const cached = await cache.match(request) || await cache.match('/');
        if (cached) return cached;
        throw err;
    }
}

async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;
    const fresh = await fetch(request);
    if (fresh && fresh.ok) {
        cache.put(request, fresh.clone()).catch(() => {});
    }
    return fresh;
}

async function tileCacheFirst(request) {
    const cache = await caches.open(TILES_CACHE);
    const cached = await cache.match(request);
    if (cached) {
        // Comprueba expiración con la cabecera personalizada que guardamos
        const cachedAt = cached.headers.get('x-iss-cached-at');
        if (cachedAt && Date.now() - Number(cachedAt) < TILE_MAX_AGE_MS) {
            return cached;
        }
    }
    try {
        const fresh = await fetch(request);
        if (fresh && fresh.ok) {
            // Re-empaquetamos la respuesta para añadir cabecera de timestamp
            const body = await fresh.clone().blob();
            const headers = new Headers(fresh.headers);
            headers.set('x-iss-cached-at', String(Date.now()));
            const stamped = new Response(body, {
                status: fresh.status,
                statusText: fresh.statusText,
                headers
            });
            cache.put(request, stamped.clone()).catch(() => {});
            return stamped;
        }
        return fresh;
    } catch (err) {
        if (cached) return cached;
        throw err;
    }
}

self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Sólo GET
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // APIs en vivo: nunca cacheamos (siempre fresco)
    if (isLiveApiRequest(url)) {
        return; // dejar al navegador hacer la petición normal
    }

    // Navegación HTML: network-first con fallback offline
    if (isHtmlNavigation(request, url)) {
        event.respondWith(networkFirstHtml(request));
        return;
    }

    // Assets versionados de Nuxt: cache-first
    if (isNuxtAsset(url)) {
        event.respondWith(cacheFirst(request, ASSETS_CACHE));
        return;
    }

    // Iconos / manifest / OG: cache-first
    if (isStaticIcon(url)) {
        event.respondWith(cacheFirst(request, ASSETS_CACHE));
        return;
    }

    // Tiles del mapa: cache-first con expiración
    if (isTileRequest(url)) {
        event.respondWith(tileCacheFirst(request));
        return;
    }

    // Resto: dejar pasar
});

/* ==========================================================================
 * Notificaciones de paso de la ISS
 *
 * El cliente envía postMessage con:
 *   { type: 'schedule-pass', alarm: { id, fireAt, payload } }
 *   { type: 'cancel-pass',   id: '...' }
 *   { type: 'list-pass' }   // diagnóstico
 *
 * Mantenemos los timeouts vivos en un Map. Si el SW se descarga (porque el
 * navegador decide), los timers se pierden, pero el cliente reconcilia al
 * volver a abrir la app.
 * ========================================================================== */

const passTimers = new Map();
// Almacenamos también los datos de cada alarma por si el SW se reinicia y queremos saber qué tenemos
const passData = new Map();

function clearPassTimer(id) {
    const handle = passTimers.get(id);
    if (handle) {
        clearTimeout(handle);
        passTimers.delete(id);
    }
}

function schedulePass(alarm) {
    if (!alarm || !alarm.id || !alarm.fireAt || !alarm.payload) return;

    // Si ya teníamos uno con ese id, lo reemplazamos
    clearPassTimer(alarm.id);

    const delay = alarm.fireAt - Date.now();
    if (delay <= 0) {
        showPassNotification(alarm.payload);
        passData.delete(alarm.id);
        return;
    }

    // setTimeout máx int32: ~24.8 días. Pasos ISS están dentro de 48h, sobra.
    const safeDelay = Math.min(delay, 2_000_000_000);
    const handle = setTimeout(() => {
        showPassNotification(alarm.payload);
        passTimers.delete(alarm.id);
        passData.delete(alarm.id);
    }, safeDelay);

    passTimers.set(alarm.id, handle);
    passData.set(alarm.id, alarm);
}

function showPassNotification(payload) {
    const opts = {
        body: payload.body || 'La ISS pasará pronto sobre tu ubicación.',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: payload.tag || 'iss-pass',
        data: { url: payload.url || '/' },
        requireInteraction: false,
        renotify: false
    };
    return self.registration
        .showNotification(payload.title || '🛰️ Paso de la ISS', opts)
        .catch(() => { /* permisos revocados o navegador sin soporte */ });
}

self.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;

    if (data.type === 'schedule-pass' && data.alarm) {
        schedulePass(data.alarm);
        return;
    }

    if (data.type === 'cancel-pass' && data.id) {
        clearPassTimer(data.id);
        passData.delete(data.id);
        // También cierra cualquier notificación visible con ese tag
        const tag = `iss-pass-${data.id.replace('pass-', '')}`;
        self.registration.getNotifications({ tag }).then((list) => {
            list.forEach((n) => n.close());
        }).catch(() => {});
        return;
    }

    if (data.type === 'list-pass') {
        const ids = Array.from(passTimers.keys());
        event.source && event.source.postMessage({ type: 'list-pass-result', ids });
        return;
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = (event.notification.data && event.notification.data.url) || '/';

    event.waitUntil((async () => {
        // Intenta enfocar una pestaña ya abierta de la app antes que abrir otra
        const allClients = await self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        });
        const sameOrigin = allClients.filter((c) => {
            try {
                return new URL(c.url).origin === self.location.origin;
            } catch {
                return false;
            }
        });
        if (sameOrigin.length > 0) {
            const client = sameOrigin[0];
            try {
                await client.focus();
                if ('navigate' in client) {
                    await client.navigate(targetUrl).catch(() => {});
                }
                return;
            } catch {
                /* sigue al openWindow */
            }
        }
        if (self.clients.openWindow) {
            await self.clients.openWindow(targetUrl);
        }
    })());
});
