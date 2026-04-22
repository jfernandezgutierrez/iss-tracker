<template>
  <div class="content-page">
    <p class="eyebrow">ISS Tracker</p>
    <h1>Contacto</h1>

    <p>
      Si tienes alguna duda, sugerencia o problema con la web puedes contactar mediante el siguiente correo:
    </p>

    <a class="email-card" href="mailto:javiusxia@gmail.com">
      <span class="email-label">Email</span>
      <span class="email-value">javiusxia@gmail.com</span>
    </a>

    <p>
      Intentaremos responder lo antes posible.
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
