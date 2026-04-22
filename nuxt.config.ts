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
        },
        {
          src: 'https://pl29208548.profitablecpmratenetwork.com/2361b580da27d32bb79de3389aa0d507/invoke.js',
         
        },
        {
          src: 'https://pl29209784.profitablecpmratenetwork.com/e1/1a/95/e11a9535f8a63e699a54f00570f74691.js',
         
        },
         {
          src: 'https://www.highperformanceformat.com/294d3e204639403fe20133f59f5ed03d/invoke.js',
         
        }

      ]
    }
  }
})
