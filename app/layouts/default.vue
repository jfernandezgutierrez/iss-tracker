<script setup lang="ts">
import Header from '../components/layout/Header.vue'
useHead({ script: [{ key: 'legacy-adsense', src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9132261570607637', async: true, crossorigin: 'anonymous' }] })
</script>

<template>
  <div class="default-layout">
    <Header />
    <slot />
  </div>
</template>

<style scoped>
.default-layout { display: contents; }
</style>
