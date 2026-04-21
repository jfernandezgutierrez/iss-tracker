<script setup lang="ts">
const videoId = 'sWasdbDVNvc'

const embedUrl = `https://www.youtube.com/embed/${videoId}`
const watchUrl = `https://www.youtube.com/watch?v=${videoId}`
</script>

<template>
  <div class="section-content">
    <div class="video-wrapper">
      <iframe
        :src="embedUrl"
        title="ISS Live - NASA"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
        referrerpolicy="strict-origin-when-cross-origin"
      ></iframe>
    </div>

    <div class="live-info">
      <p class="live-title">Directo oficial de la ISS</p>
      <p class="live-subtitle">NASA YouTube</p>

      <a
        :href="watchUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="live-link"
      >
        Abrir en YouTube
      </a>
    </div>
  </div>
</template>

<style scoped>
.video-wrapper {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
}

.video-wrapper iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.live-info {
  margin-top: 12px;
}

.live-title {
  margin: 0 0 4px;
  font-weight: 700;
}

.live-subtitle {
  margin: 0 0 10px;
  color: #bdbdbd;
  font-size: 14px;
}

.live-link {
  display: inline-block;
  padding: 10px 14px;
  border-radius: 10px;
  background: #2a2a2a;
  color: white;
  text-decoration: none;
}

.live-link:hover {
  background: #3a3a3a;
}
</style>