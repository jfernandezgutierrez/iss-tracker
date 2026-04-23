export default defineNuxtConfig({
  compatibilityDate: '2026-03-31',

  css: [
    '~/assets/css/global.css'
  ],

  app: {
    head: {
      script: [
        {
          src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9132261570607637',
          async: true,
          crossorigin: 'anonymous'
        }

      ]
    }
  }
})
