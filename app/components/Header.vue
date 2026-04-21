<template>
  <header class="header">
    <h1 class="logo">ISS Tracker</h1>

    <nav class="nav">
        <!-- 
      <button>Mapa</button>
      <button>Tripulación</button>
      <button>Blog</button>-->
    <NuxtLink to="/" exact-active-class="router-link-active">Mapa</NuxtLink>
      <NuxtLink to="/about">Sobre</NuxtLink>
      <NuxtLink to="/contact">Contacto</NuxtLink>
      <NuxtLink to="/privacy-policy">Privacidad</NuxtLink> </nav>
  </header>
</template>

<style scoped>
.header {
  height: 60px;
  background: #0f0f0f;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid #1f1f1f;
}

/* LOGO */
.logo {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* NAV */
.nav {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* LINKS */
.nav a {
  text-decoration: none;
  color: #e0e0e0;
  background: #1a1a1a;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

/* HOVER */
.nav a:hover {
  background: #262626;
  color: white;
  transform: translateY(-1px);
}

/* ACTIVO (NuxtLink lo añade automático) */
.nav a.router-link-active {
  background: #2d6cdf;
  color: white;
  border: 1px solid #3f7cff;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .header {
    padding: 0 10px;
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