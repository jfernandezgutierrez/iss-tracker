export default defineNuxtConfig({
  compatibilityDate: '2026-03-31',

  css: [
    '~/assets/css/global.css'
  ],

  app: {
    head: {
      htmlAttrs: {
        lang: 'es'
      },
      titleTemplate: '%s · ISS Tracker',
      title: 'ISS Tracker en tiempo real — Sigue la Estación Espacial Internacional',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'ISS Tracker en tiempo real: sigue la posición actual de la Estación Espacial Internacional sobre el mapa, consulta la tripulación a bordo, ve los directos oficiales de la NASA y calcula cuándo pasará la ISS sobre tu ubicación.'
        },
        {
          name: 'keywords',
          content: 'ISS, Estación Espacial Internacional, ISS en tiempo real, dónde está la ISS, seguir ISS, posición ISS, directos NASA, NASA TV en directo, tripulación ISS, astronautas ISS, paso de la ISS, cuándo pasa la ISS, órbita ISS, mapa ISS'
        },
        { name: 'robots', content: 'index, follow, max-image-preview:large' },
        { name: 'author', content: 'ISS Tracker' },
        { name: 'theme-color', content: '#0B1220' },

        // Open Graph
        { property: 'og:site_name', content: 'ISS Tracker' },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'es_ES' },
        { property: 'og:url', content: 'https://isstrackerlive.es/' },
        { property: 'og:title', content: 'ISS Tracker en tiempo real — Sigue la Estación Espacial Internacional' },
        {
          property: 'og:description',
          content: 'Posición en vivo de la ISS sobre el mapa, tripulación actual, directos de la NASA y predicción del próximo paso sobre tu ubicación.'
        },
        { property: 'og:image', content: 'https://isstrackerlive.es/og-image.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'ISS Tracker — Sigue la Estación Espacial Internacional en directo' },

        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'ISS Tracker en tiempo real — Estación Espacial Internacional' },
        {
          name: 'twitter:description',
          content: 'Sigue la ISS en directo sobre el mapa, mira los directos de la NASA y descubre quién está a bordo ahora mismo.'
        },
        { name: 'twitter:image', content: 'https://isstrackerlive.es/og-image.png' },
        { name: 'twitter:image:alt', content: 'ISS Tracker — Sigue la Estación Espacial Internacional en directo' }
      ],
      link: [
        { rel: 'canonical', href: 'https://isstrackerlive.es/' },
        { rel: 'icon', type: 'image/svg+xml', href: '/iss-icon.svg' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/manifest.webmanifest' }
      ],
      script: [
        // Google Consent Mode v2: deniega todo por defecto hasta que el usuario acepte
        {
          innerHTML: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              analytics_storage: 'denied',
              wait_for_update: 2000
            });
            gtag('js', new Date());
          `
        },
        {
          src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9132261570607637',
          async: true,
          crossorigin: 'anonymous'
        },
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'ISS Tracker',
            alternateName: 'ISS Tracker Live',
            url: 'https://isstrackerlive.es/',
            inLanguage: 'es-ES',
            description: 'Sigue la posición en tiempo real de la Estación Espacial Internacional, la tripulación a bordo, los directos de la NASA y el próximo paso de la ISS sobre tu ubicación.'
          })
        }
      ]
    }
  }
})
