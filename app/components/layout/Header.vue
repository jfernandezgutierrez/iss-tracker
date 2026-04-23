<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const menuOpen = ref(false)
const route = useRoute()

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeMenu()
}

// Cierra el menú al navegar entre rutas
watch(() => route.fullPath, () => closeMenu())

// Bloquea el scroll del body cuando el menú está abierto en móvil
watch(menuOpen, (open) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = open ? 'hidden' : ''
})

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <header class="header">
    <NuxtLink to="/" class="logo" @click="closeMenu">
      <span class="logo-dot"></span>
      ISS Tracker
    </NuxtLink>

    <!-- Navegación principal: centrada en desktop, desplegable en móvil -->
    <nav
      class="nav"
      :class="{ 'is-open': menuOpen }"
      :aria-hidden="!menuOpen ? 'true' : 'false'"
    >
      <NuxtLink to="/" exact-active-class="router-link-active" @click="closeMenu">Mapa</NuxtLink>
      <NuxtLink to="/tripulacion" @click="closeMenu">Tripulación</NuxtLink>
      <NuxtLink to="/directos" @click="closeMenu">Directos</NuxtLink>
      <NuxtLink to="/contact" @click="closeMenu">Contacto</NuxtLink>
      <NuxtLink to="/privacy-policy" @click="closeMenu">Privacidad</NuxtLink>
    </nav>

    <!-- Botón hamburguesa (solo visible en móvil vía CSS) -->
    <button
      type="button"
      class="menu-toggle"
      :class="{ 'is-open': menuOpen }"
      :aria-expanded="menuOpen"
      aria-controls="nav-menu"
      aria-label="Abrir menú"
      @click="toggleMenu"
    >
      <span class="bar"></span>
      <span class="bar"></span>
      <span class="bar"></span>
    </button>

    <!-- Backdrop para cerrar el menú tocando fuera en móvil -->
    <div
      v-if="menuOpen"
      class="menu-backdrop"
      @click="closeMenu"
      aria-hidden="true"
    ></div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 900;
  height: 60px;
  background: var(--surface);
  color: var(--text);
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow-soft);
}

/* =================== Logo =================== */
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--text);
  text-decoration: none;
  justify-self: start;
}

.logo-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 14px var(--glow-accent);
}

/* =================== Nav (desktop: centrada) =================== */
.nav {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  justify-self: center;
  grid-column: 2;
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

/* =================== Botón hamburguesa =================== */
.menu-toggle {
  display: none; /* solo se muestra en móvil */
  width: 42px;
  height: 42px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  padding: 0;
  position: relative;
  justify-self: end;
  grid-column: 3;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.menu-toggle:hover {
  background: var(--surface-3);
  border-color: var(--primary);
}

.menu-toggle .bar {
  position: absolute;
  left: 50%;
  width: 18px;
  height: 2px;
  background: var(--text);
  border-radius: 1px;
  transform: translateX(-50%);
  transition: transform 0.28s ease, top 0.28s ease, opacity 0.2s ease;
}

.menu-toggle .bar:nth-child(1) { top: 14px; }
.menu-toggle .bar:nth-child(2) { top: 20px; }
.menu-toggle .bar:nth-child(3) { top: 26px; }

.menu-toggle.is-open .bar:nth-child(1) {
  top: 20px;
  transform: translateX(-50%) rotate(45deg);
}
.menu-toggle.is-open .bar:nth-child(2) {
  opacity: 0;
}
.menu-toggle.is-open .bar:nth-child(3) {
  top: 20px;
  transform: translateX(-50%) rotate(-45deg);
}

/* Backdrop para cerrar tocando fuera (solo visible en móvil) */
.menu-backdrop {
  display: none;
}

/* =================== Responsive =================== */
@media (max-width: 820px) {
  .header {
    padding: 0 14px;
    grid-template-columns: 1fr auto;
  }

  .logo {
    font-size: 16px;
    grid-column: 1;
  }

  .menu-toggle {
    display: block;
    grid-column: 2;
  }

  /* Panel desplegable desde arriba */
  .nav {
    position: absolute;
    top: 60px;
    left: 0;
    right: 0;
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 14px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    box-shadow: 0 20px 30px -20px rgba(0, 0, 0, 0.6);

    /* Animación: oculto por defecto */
    opacity: 0;
    transform: translateY(-10px);
    pointer-events: none;
    transition: opacity 0.25s ease, transform 0.25s ease;
  }

  .nav.is-open {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }

  .nav a {
    width: 100%;
    text-align: center;
    padding: 12px 14px;
    font-size: 15px;
    animation: nav-item-in 0.35s ease both;
  }

  .nav.is-open a:nth-child(1) { animation-delay: 0.02s; }
  .nav.is-open a:nth-child(2) { animation-delay: 0.06s; }
  .nav.is-open a:nth-child(3) { animation-delay: 0.10s; }
  .nav.is-open a:nth-child(4) { animation-delay: 0.14s; }
  .nav.is-open a:nth-child(5) { animation-delay: 0.18s; }

  @keyframes nav-item-in {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Backdrop semi-transparente detrás del panel */
  .menu-backdrop {
    display: block;
    position: fixed;
    inset: 60px 0 0 0;
    background: rgba(4, 8, 18, 0.55);
    backdrop-filter: blur(2px);
    z-index: -1;
    animation: backdrop-in 0.25s ease both;
  }

  @keyframes backdrop-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
}

@media (max-width: 420px) {
  .logo {
    font-size: 15px;
  }
}

/* Reducción de movimiento */
@media (prefers-reduced-motion: reduce) {
  .nav,
  .nav a,
  .menu-toggle .bar,
  .menu-backdrop {
    animation: none !important;
    transition: none !important;
  }
}
</style>
