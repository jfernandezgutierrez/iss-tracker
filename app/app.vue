<script setup>
import Header from './components/layout/Header.vue'
</script>

<template>
  <div class="app">
    <Header />
    <NuxtPage />
  </div>
</template>

<style>
/* Los estilos base ahora viven en assets/css/global.css */

.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg);
  color: var(--text);
}

.main {
  flex: 1;
  display: flex;
  min-height: 0;
}

.map-container,
.panel-container {
  min-width: 0;
  min-height: 0;
  height: 100%;
}

.resizer {
  width: 8px;
  background: var(--surface-2);
  cursor: col-resize;
  flex-shrink: 0;
  transition: background 0.2s ease;
}

.resizer:hover {
  background: var(--primary);
}

@media (max-width: 768px) {
  .main {
    flex-direction: column;
  }

  .map-container,
  .panel-container {
    width: 100% !important;
  }

  .map-container {
    height: 50vh;
  }

  .panel-container {
    height: 50vh;
  }

  .resizer {
    display: none;
  }
}
</style>
