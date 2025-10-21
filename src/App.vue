<template>
  <TopBar />
  <div id="layout">
    <MapISS class="left-panel" />
    <div
      id="divider"
      @mousedown="startResize"
    ></div>
    <RightPanel id="right-panel" />
  </div>
</template>

<script setup>
  import { onMounted, onBeforeUnmount } from 'vue';
  import TopBar from './components/TopBar.vue';
  import MapISS from './components/MapISS.vue';
  import RightPanel from './components/RightPanel.vue';

  let isDragging = false;

  function startResize(e) {
    e.preventDefault();
    isDragging = true;
    document.body.style.cursor = 'ew-resize';
  }

  function stopResize() {
    if (isDragging) {
      isDragging = false;
      document.body.style.cursor = 'default';
    }
  }

  function handleResize(e) {
    if (!isDragging) return;

    const layout = document.getElementById('layout');
    const left = document.querySelector('.left-panel');
    const right = document.getElementById('right-panel');

    const rect = layout.getBoundingClientRect();
    const totalWidth = rect.width;
    const offsetX = e.clientX - rect.left;

    // límites: mínimo 25 % – máximo 75 %
    const min = totalWidth * 0.25;
    const max = totalWidth * 0.75;
    if (offsetX < min || offsetX > max) return;

    left.style.width = offsetX + 'px';
    right.style.width = totalWidth - offsetX - 8 + 'px';

    // 🛰️ Recalcular el mapa (esperar al nuevo tamaño del panel)
    setTimeout(() => {
      const mapEl = document.getElementById('map');
      if (mapEl && mapEl._leaflet_map) {
        mapEl._leaflet_map.invalidateSize();
      }
    }, 150);
  }

  onMounted(() => {
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
  });
</script>

<style scoped>
  #layout {
    display: flex;
    flex-direction: row;
    height: 100vh;
    width: 100%;
    overflow: hidden;
  }

  /* 🔹 Panel izquierdo (mapa) */
  .left-panel {
    position: relative;
    height: 100vh;
    flex: 0 0 auto;
    min-width: 25%;
    max-width: 75%;
    width: 60%;
    overflow: hidden; /* evita que el mapa desborde */
  }

  /* 🔹 Barra divisoria */
  #divider {
    flex: 0 0 8px;
    cursor: ew-resize;
    background: linear-gradient(to right, #00e1ff44, #00ffeeaa);
    transition: background 0.2s ease;
    z-index: 10;
  }
  #divider:hover {
    background: linear-gradient(to right, #00ffee, #00e1ff);
  }

  /* 🔹 Panel derecho */
  #right-panel {
    flex: 0 0 auto;
    width: calc(40% - 8px);
    transition: width 0.1s linear;
    overflow-y: auto;
  }

  /* 📱 Adaptación móvil */
  @media (max-width: 900px) {
    #layout {
      flex-direction: column;
    }
    #divider {
      display: none;
    }
    .left-panel,
    #right-panel {
      width: 100% !important;
    }
  }
</style>
