<script setup lang="ts">
useHead({
  title: 'Política de Privacidad — ISS Tracker',
  meta: [
    {
      name: 'description',
      content: 'Política de privacidad de ISS Tracker: información sobre el uso de cookies, Google AdSense, recogida de datos y cómo ejercer tus derechos como usuario.'
    },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:title', content: 'Política de Privacidad — ISS Tracker' },
    {
      property: 'og:description',
      content: 'Cómo tratamos tus datos, cookies y anuncios personalizados en ISS Tracker.'
    },
    { property: 'og:url', content: 'https://isstrackerlive.es/privacy-policy' }
  ],
  link: [
    { rel: 'canonical', href: 'https://isstrackerlive.es/privacy-policy' }
  ]
})
</script>

<template>
  <div class="content-page">
    <p class="eyebrow">ISS Tracker</p>
    <h1>Política de Privacidad</h1>

    <p>
      En <strong>isstrackerlive.es</strong> respetamos tu privacidad y nos comprometemos a proteger
      tus datos personales. Esta política explica qué información recogemos cuando usas ISS Tracker,
      para qué la utilizamos y qué opciones tienes sobre ella.
    </p>

    <h2>Uso de cookies</h2>
    <p>
      ISS Tracker utiliza cookies propias y de terceros para mejorar la experiencia de navegación,
      analizar el tráfico del sitio y mostrar anuncios relevantes a través de servicios como Google AdSense.
      Puedes configurar o bloquear las cookies desde los ajustes de tu navegador en cualquier momento.
    </p>

    <h2>Google AdSense y anuncios personalizados</h2>
    <p>
      Google y sus socios publicitarios pueden usar cookies y tecnologías similares para mostrar
      anuncios basados en tus visitas anteriores a este u otros sitios web, con el fin de ofrecerte
      contenido publicitario más relevante.
    </p>

    <p>
      Puedes desactivar la personalización de anuncios en cualquier momento desde la configuración
      de anuncios de Google:
      <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">
        https://adssettings.google.com
      </a>.
    </p>

    <h2>Datos recogidos</h2>
    <p>
      ISS Tracker no solicita ni almacena datos personales de forma directa. Los datos que se
      recogen para análisis y publicidad son gestionados por servicios de terceros (como Google) y
      se rigen por sus propias políticas de privacidad. La ubicación que introduces para calcular
      el próximo paso de la ISS se utiliza únicamente en tu navegador y no se guarda en ningún servidor.
    </p>

    <h2>Contacto</h2>
    <p>
      Si tienes cualquier duda sobre esta política de privacidad o quieres ejercer tus derechos de
      acceso, rectificación o supresión, puedes escribirnos desde la
      <NuxtLink to="/contact">página de contacto</NuxtLink>.
    </p>
  </div>
</template>
