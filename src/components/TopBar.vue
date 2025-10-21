<template>
  <!-- Splash de carga -->
  <transition name="fade">
    <div v-if="showSplash" id="splash">
      <div class="loader"></div>
      <p>Conectando con la ISS...</p>
    </div>
  </transition>

  <div id="topbar">
    <h1>
      <img src="/iss-icon.png" alt="ISS" />
      ISS Tracker — Don Javiusx 🚀
    </h1>

    <div id="timeDisplay">
      <span>UTC {{ utcTime }}</span> |
      <span>Local {{ localTime }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const showSplash = ref(true)
const utcTime = ref('--:--:--')
const localTime = ref('--:--:--')

// Oculta splash tras 1.8 s
onMounted(() => {
  setTimeout(() => (showSplash.value = false), 1800)
  updateClocks()
  setInterval(updateClocks, 1000)
})

function updateClocks() {
  const now = new Date()
  utcTime.value = now.toUTCString().split(' ')[4]
  localTime.value = now.toLocaleTimeString()
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
