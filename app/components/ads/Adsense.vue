<template>
  <div class="adsense-container">
    <ins
      class="adsbygoogle"
      style="display:block"
      data-ad-client="ca-pub-TU_ID"
      data-ad-slot="TU_SLOT_ID"
      data-ad-format="auto"
      data-full-width-responsive="true"
    ></ins>
  </div>
</template>

<script setup>
onMounted(() => {
  try {
    if (process.client) {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    }
  } catch (error) {
    console.error('Adsense error:', error)
  }
})
</script>

<style scoped>
.adsense-container {
  width: 100%;
  min-height: 100px;
}
</style>