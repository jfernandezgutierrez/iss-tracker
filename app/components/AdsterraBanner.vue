<template>
  <div class="adsterra-banner">
    <div id="container-2361b580da27d32bb79de3389aa0d507"></div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  if (document.querySelector('script[data-adsterra-banner="main-top"]')) return

  const script = document.createElement('script')
  script.src = 'https://pl29208548.profitablecpmratenetwork.com/2361b580da27d32bb79de3389aa0d507/invoke.js'
  script.async = true
  script.setAttribute('data-cfasync', 'false')
  script.setAttribute('data-adsterra-banner', 'main-top')

  document.body.appendChild(script)
})
</script>

<style scoped>
.adsterra-banner {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  margin: 8px 0 12px;
}
</style>