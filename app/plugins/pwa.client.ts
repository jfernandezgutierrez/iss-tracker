/**
 * Registra el service worker que hace la app instalable y le da soporte offline básico.
 * Sólo corre en cliente (sufijo .client.ts).
 */
export default defineNuxtPlugin(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    // En desarrollo no registramos el SW para evitar que cachee el HMR de Nuxt.
    if (import.meta.dev) return

    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js', { scope: '/' })
            .then((registration) => {
                // eslint-disable-next-line no-console
                console.info('[pwa] Service Worker registrado:', registration.scope)
            })
            .catch((err) => {
                // eslint-disable-next-line no-console
                console.warn('[pwa] No se pudo registrar el Service Worker:', err)
            })
    })
})
