<template>
  <div class="layout">
    <header>
      <h1>ISS Tracker — Don Javiusx 🚀</h1>
      <p>{{ utc }} | {{ local }}</p>
    </header>
    <MapISS class="map-section" />
    <section class="info-section">
      <InfoISS />
      <CrewList />
      <PassesPanel />
      <LiveISS />
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MapISS from '@/components/MapISS.vue'
import InfoISS from '@/components/InfoISS.vue'
import CrewList from '@/components/CrewList.vue'
import PassesPanel from '@/components/PassesPanel.vue'
import LiveISS from '@/components/LiveISS.vue'

const utc = ref('')
const local = ref('')

onMounted(() => {
  setInterval(() => {
    const now = new Date()
    utc.value = 'UTC ' + now.toUTCString().split(' ')[4]
    local.value = 'Local ' + now.toLocaleTimeString()
  }, 1000)
})
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: row;
  height: 100vh;
}
header {
  position: fixed;
  top: 0;
  width: 100%;
  text-align: center;
  color: #00ffee;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}
.map-section {
  flex: 1;
  height: 100vh;
}
.info-section {
  flex: 1;
  background: rgba(0, 13, 25, 0.8);
  overflow-y: auto;
  padding: 20px;
}

/* Modo móvil */
@media (max-width: 900px) {
  .layout {
    flex-direction: column;
  }
  .map-section {
    height: 50vh;
  }
}
</style>
