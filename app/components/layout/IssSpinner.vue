<script setup lang="ts">
interface Props {
  label?: string
  size?: 'sm' | 'md' | 'lg'
  /**
   * - 'inline': se renderiza tal cual, dentro del flujo
   * - 'overlay': se posiciona absoluto para cubrir al padre (que debe tener position:relative)
   */
  variant?: 'inline' | 'overlay'
}

withDefaults(defineProps<Props>(), {
  label: 'Conectando con la ISS',
  size: 'md',
  variant: 'inline'
})
</script>

<template>
  <div :class="['iss-spinner', `size-${size}`, `variant-${variant}`]" role="status" aria-live="polite">
    <div class="scene">
      <!-- Campo de estrellas de fondo -->
      <div class="stars">
        <span class="star" v-for="n in 14" :key="n" :style="`--i:${n}`"></span>
      </div>

      <!-- Órbita estática -->
      <div class="orbit-ring"></div>

      <!-- Ondas de señal que emite la Tierra -->
      <div class="signal signal-1"></div>
      <div class="signal signal-2"></div>

      <!-- Planeta -->
      <div class="earth">
        <div class="earth-glow"></div>
        <div class="earth-continents"></div>
      </div>

      <!-- Grupo que rota: estela + ISS -->
      <div class="orbit-rotate">
        <div class="trail"></div>
        <div class="iss-marker">
          <svg viewBox="-10 -4 20 8" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <!-- Paneles solares -->
            <rect x="-9" y="-1.5" width="6" height="3" rx="0.5" fill="currentColor" opacity="0.9" />
            <rect x="3" y="-1.5" width="6" height="3" rx="0.5" fill="currentColor" opacity="0.9" />
            <!-- Módulo central -->
            <rect x="-2.5" y="-1" width="5" height="2" rx="0.8" fill="currentColor" />
          </svg>
        </div>
      </div>
    </div>

    <p v-if="label" class="spinner-label">
      {{ label }}<span class="dots" aria-hidden="true"></span>
    </p>
  </div>
</template>

<style scoped>
.iss-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  color: var(--text);
}

.iss-spinner.variant-overlay {
  position: absolute;
  inset: 0;
  z-index: 500;
  background:
    radial-gradient(circle at center, rgba(7, 11, 20, 0.85), rgba(7, 11, 20, 0.95)),
    var(--bg);
  backdrop-filter: blur(6px);
}

/* ===================== Escena ===================== */
.scene {
  position: relative;
  --loader-size: 140px;
  width: var(--loader-size);
  height: var(--loader-size);
}

.size-sm .scene {
  --loader-size: 64px;
}

.size-md .scene {
  --loader-size: 140px;
}

.size-lg .scene {
  --loader-size: 220px;
}

/* ===================== Estrellas ===================== */
.stars {
  position: absolute;
  inset: -20%;
  pointer-events: none;
}

.star {
  position: absolute;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: var(--text);
  opacity: 0.55;
  animation: twinkle calc(2s + var(--i, 1) * 0.2s) ease-in-out infinite;
  animation-delay: calc(var(--i, 1) * -0.23s);
}

/* Disposición pseudo-aleatoria pero estable de las estrellas */
.star:nth-child(1)  { top: 8%;  left: 12%; }
.star:nth-child(2)  { top: 18%; left: 78%; }
.star:nth-child(3)  { top: 32%; left: 4%;  }
.star:nth-child(4)  { top: 6%;  left: 52%; }
.star:nth-child(5)  { top: 65%; left: 88%; }
.star:nth-child(6)  { top: 82%; left: 18%; }
.star:nth-child(7)  { top: 48%; left: 95%; }
.star:nth-child(8)  { top: 92%; left: 60%; }
.star:nth-child(9)  { top: 22%; left: 34%; }
.star:nth-child(10) { top: 72%; left: 42%; }
.star:nth-child(11) { top: 55%; left: 8%;  }
.star:nth-child(12) { top: 38%; left: 70%; }
.star:nth-child(13) { top: 85%; left: 82%; }
.star:nth-child(14) { top: 12%; left: 92%; }

@keyframes twinkle {
  0%, 100% { opacity: 0.2; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.4); }
}

/* ===================== Órbita fija ===================== */
.orbit-ring {
  position: absolute;
  inset: 12%;
  border-radius: 50%;
  border: 1px dashed rgba(77, 163, 255, 0.28);
}

/* ===================== Ondas de señal ===================== */
.signal {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 34%;
  height: 34%;
  border-radius: 50%;
  border: 1.5px solid var(--accent);
  transform: translate(-50%, -50%);
  opacity: 0;
  animation: signal 3.2s ease-out infinite;
}

.signal-2 {
  animation-delay: 1.6s;
}

@keyframes signal {
  0% {
    opacity: 0;
    width: 34%;
    height: 34%;
  }
  20% {
    opacity: 0.7;
  }
  100% {
    opacity: 0;
    width: 110%;
    height: 110%;
  }
}

/* ===================== Tierra ===================== */
.earth {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 32%;
  height: 32%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background:
    radial-gradient(circle at 30% 30%, #4fa8ff 0%, #1d6bc2 45%, #0b2a56 100%);
  box-shadow:
    inset -6px -6px 14px rgba(0, 0, 0, 0.55),
    inset 4px 4px 10px rgba(160, 220, 255, 0.28),
    0 0 26px rgba(77, 163, 255, 0.45);
  overflow: hidden;
  animation: earth-spin 18s linear infinite;
}

.earth-continents {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    radial-gradient(ellipse 28% 12% at 30% 38%, rgba(56, 211, 159, 0.75) 0%, transparent 60%),
    radial-gradient(ellipse 16% 22% at 65% 28%, rgba(56, 211, 159, 0.65) 0%, transparent 60%),
    radial-gradient(ellipse 20% 16% at 55% 68%, rgba(56, 211, 159, 0.7) 0%, transparent 60%),
    radial-gradient(ellipse 12% 12% at 22% 72%, rgba(56, 211, 159, 0.6) 0%, transparent 60%);
  opacity: 0.85;
}

.earth-glow {
  position: absolute;
  inset: -8%;
  border-radius: 50%;
  background: radial-gradient(circle, transparent 55%, rgba(77, 163, 255, 0.25) 70%, transparent 80%);
  pointer-events: none;
}

@keyframes earth-spin {
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

/* ===================== Órbita rotatoria (estela + ISS) ===================== */
.orbit-rotate {
  position: absolute;
  inset: 0;
  animation: orbit 3.6s linear infinite;
}

@keyframes orbit {
  to { transform: rotate(360deg); }
}

/* Estela: conic-gradient recortado a un anillo con radial-mask */
.trail {
  position: absolute;
  inset: 12%;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    transparent 200deg,
    rgba(110, 242, 216, 0.12) 260deg,
    rgba(110, 242, 216, 0.45) 320deg,
    var(--accent) 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 46%, #000 48%, #000 52%, transparent 54%);
          mask: radial-gradient(circle, transparent 46%, #000 48%, #000 52%, transparent 54%);
}

/* ISS situada al final de la estela (en 0°, a la derecha del anillo) */
.iss-marker {
  position: absolute;
  top: 50%;
  right: 12%;
  transform: translate(50%, -50%);
  color: var(--accent);
  filter: drop-shadow(0 0 8px var(--glow-accent));
}

.size-sm .iss-marker svg { width: 14px; height: 6px; }
.size-md .iss-marker svg { width: 22px; height: 9px; }
.size-lg .iss-marker svg { width: 30px; height: 12px; }

/* ===================== Label con puntos animados ===================== */
.spinner-label {
  margin: 0;
  color: var(--text-soft);
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-align: center;
}

.size-sm .spinner-label {
  font-size: 0.82rem;
}

.size-lg .spinner-label {
  font-size: 1.05rem;
}

.dots::after {
  content: '';
  display: inline-block;
  width: 1.2em;
  text-align: left;
  animation: dots 1.4s steps(4, end) infinite;
}

@keyframes dots {
  0%   { content: ''; }
  25%  { content: '.'; }
  50%  { content: '..'; }
  75%  { content: '...'; }
  100% { content: ''; }
}

/* Respeta reduce-motion */
@media (prefers-reduced-motion: reduce) {
  .earth,
  .orbit-rotate,
  .signal,
  .star,
  .dots::after {
    animation-duration: 0s;
    animation-iteration-count: 1;
  }
}
</style>
