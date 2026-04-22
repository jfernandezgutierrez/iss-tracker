<template>
  <header class="header">
    <h1 class="logo">
      <span class="logo-dot"></span>
      ISS Tracker
    </h1>

    <nav class="nav">
      <NuxtLink to="/" exact-active-class="router-link-active">Mapa</NuxtLink>
      <NuxtLink to="/tripulacion">Tripulación</NuxtLink>
      <NuxtLink to="/contact">Contacto</NuxtLink>
      <NuxtLink to="/privacy-policy">Privacidad</NuxtLink>
    </nav>
  </header>
</template>

<style scoped>
.header {
  height: 60px;
  background: var(--surface);
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow-soft);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--text);
}

.logo-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 14px var(--glow-accent);
}

.nav {
  display: flex;
  gap: 8px;
  align-items: center;
}

.nav a {
  text-decoration: none;
  color: var(--text-soft);
  background: var(--surface-2);
  padding: 8px 14px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.nav a:hover {
  background: var(--surface-3);
  color: var(--text);
  transform: translateY(-1px);
  border-color: var(--border);
}

.nav a.router-link-active {
  background: var(--primary);
  color: #07111F;
  border-color: var(--primary-strong);
  box-shadow: 0 0 18px var(--glow);
}

@media (max-width: 768px) {
  .header {
    padding: 0 12px;
  }

  .logo {
    font-size: 16px;
  }

  .nav {
    gap: 6px;
  }

  .nav a {
    padding: 6px 10px;
    font-size: 13px;
  }
}
</style>
