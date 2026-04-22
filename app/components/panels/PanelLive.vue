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
      <div class="live-header">
        <span class="badge badge-live">● LIVE</span>
        <p class="live-title">Directo oficial de la ISS</p>
      </div>
      <p class="live-subtitle">NASA YouTube</p>

      <a
        :href="watchUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="btn btn-secondary btn-block live-link"
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
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: #000;
  border: 1px solid var(--border);
}

.video-wrapper iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.live-info {
  margin-top: 14px;
}

.live-header {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.live-title {
  margin: 0;
  color: var(--text);
  font-weight: 700;
}

.live-subtitle {
  margin: 4px 0 12px;
  color: var(--text-soft);
  font-size: 0.88rem;
}

.live-link {
  text-decoration: none;
  margin-top: 4px;
}
</style>
