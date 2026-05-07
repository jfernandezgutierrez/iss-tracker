<script setup lang="ts">
useHead({
  title: 'Contacto — ISS Tracker',
  meta: [
    {
      name: 'description',
      content: 'Contacta con ISS Tracker: envía tus dudas, sugerencias o reporta un problema de la web. Atendemos cada mensaje personalmente lo antes posible.'
    },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:title', content: 'Contacto — ISS Tracker' },
    {
      property: 'og:description',
      content: 'Ponte en contacto con el equipo de ISS Tracker para dudas, sugerencias o reportar incidencias.'
    },
    { property: 'og:url', content: 'https://isstrackerlive.es/contact' }
  ],
  link: [
    { rel: 'canonical', href: 'https://isstrackerlive.es/contact' }
  ]
})
</script>

<template>
  <div class="content-page">
    <p class="eyebrow">ISS Tracker</p>
    <h1>Contacto</h1>

    <p>
      ¿Tienes alguna duda, sugerencia, quieres colaborar o has detectado un problema en ISS Tracker?
      Estaremos encantados de leerte. Escríbenos al siguiente correo y te responderemos lo antes posible:
    </p>

    <a class="email-card" href="mailto:javiusxia@gmail.com" aria-label="Enviar correo a javiusxia@gmail.com">
      <span class="email-label">Email de contacto</span>
      <span class="email-value">javiusxia@gmail.com</span>
    </a>

    <p>
      Intentaremos responder a todos los mensajes en el menor tiempo posible. Gracias por usar
      ISS Tracker para seguir en directo la Estación Espacial Internacional.
    </p>
  </div>
</template>

<style scoped>
.email-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 18px 0;
  padding: 16px 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  text-decoration: none;
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.email-card:hover {
  border-color: var(--primary);
  transform: translateY(-1px);
  box-shadow: 0 0 24px var(--glow);
}

.email-label {
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.74rem;
  font-weight: 700;
}

.email-value {
  color: var(--text);
  font-weight: 700;
  font-size: 1.05rem;
}
</style>
