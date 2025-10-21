<template>
  <div id="right-panel">
    <!-- 🛰️ ISS en tiempo real -->
    <div class="block" :class="{ collapsed: collapsed[0] }">
      <h2 @click="toggleBlock(0)">🛰️ ISS en tiempo real</h2>
      <div class="block-content">
        <template v-if="data">
          <p>🌍 <b>Latitud:</b> {{ data.latitude.toFixed(2) }}°</p>
          <p>🌎 <b>Longitud:</b> {{ data.longitude.toFixed(2) }}°</p>
          <p>⛰️ <b>Altitud:</b> {{ data.altitude.toFixed(1) }} km</p>
          <p>💨 <b>Velocidad:</b> {{ data.velocity.toFixed(0) }} km/h</p>
        </template>
        <p v-else>Cargando datos ISS…</p>
      </div>
    </div>

    <!-- 👨‍🚀 Astronautas -->
    <div class="block" :class="{ collapsed: collapsed[1] }">
      <h2 @click="toggleBlock(1)">👨‍🚀 Astronautas a bordo</h2>
      <div class="block-content">
        <template v-if="crew.length">
          <div v-for="a in crew" :key="a.id" class="astronaut">
            <img :src="getFlag(a.nationality)" width="22" />
            <img
              :src="a.profile_image || 'https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg'"
              width="40"
              height="40"
            />
            <div>
              <b>{{ a.name }}</b><br />
              <small>{{ a.agency?.name || 'Agencia desconocida' }}</small>
            </div>
          </div>
        </template>
        <p v-else>Cargando tripulación…</p>
      </div>
    </div>

    <!-- 📍 Predicción de pasos -->
    <div class="block" :class="{ collapsed: collapsed[2] }">
      <h2 @click="toggleBlock(2)">📍 Predicción de pasos visibles</h2>
      <div class="block-content">
        <div class="inputs">
          <label>Latitud:</label>
          <input v-model.number="lat" type="number" step="0.01" placeholder="Ej: 43.46" />
          <label>Longitud:</label>
          <input v-model.number="lon" type="number" step="0.01" placeholder="Ej: -3.80" />
          <button @click="calcPasses" :disabled="loading">
            {{ loading ? '⏳ Cargando...' : '🔍 Calcular pasos ISS' }}
          </button>
        </div>
        <div id="passes">
          <template v-if="passes.length">
            <table>
              <tr v-for="p in passes" :key="p.startUTC">
                <td>🕒 {{ new Date(p.startUTC * 1000).toLocaleString() }}</td>
                <td>Duración: <b>{{ ((p.endUTC - p.startUTC)/60).toFixed(1) }}</b> min</td>
                <td>Alt máx: {{ p.maxEl }}°</td>
              </tr>
            </table>
          </template>
          <p v-else-if="!loading">No hay pasos visibles esta semana.</p>
        </div>
      </div>
    </div>

    <!-- 📺 Directo -->
    <div class="block" :class="{ collapsed: collapsed[3] }">
      <h2 @click="toggleBlock(3)">📺 Directo desde la ISS</h2>
      <div class="block-content">
        <iframe
          width="100%"
          height="240"
          src="https://www.youtube.com/embed/yf5cEJULZXk?autoplay=1&mute=1"
          frameborder="0"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        ></iframe>
      </div>
    </div>

    <footer>Desarrollado por Don Javiusx 🌌</footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useISSStore } from '../store/issStore'

const store = useISSStore()
const { data, crew, passes } = storeToRefs(store)

const lat = ref(null)
const lon = ref(null)
const loading = ref(false)

// Bloques colapsables
const collapsed = ref([false, false, false, false])

function toggleBlock(i) {
  collapsed.value[i] = !collapsed.value[i]
  localStorage.setItem(`blockState_${i}`, collapsed.value[i] ? 'collapsed' : 'open')
}

// === MOUNTED ===
onMounted(() => {
  // Restaurar estados de bloques
  for (let i = 0; i < collapsed.value.length; i++) {
    const s = localStorage.getItem(`blockState_${i}`)
    collapsed.value[i] = s === 'collapsed'
  }

  // Cargar datos ISS y crew
  store.fetchISS()
  store.fetchCrew()
  setInterval(store.fetchISS, 5000)

  // Geolocalización automática
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        lat.value = pos.coords.latitude.toFixed(2)
        lon.value = pos.coords.longitude.toFixed(2)
        calcPasses()
      },
      (err) => console.warn('No se pudo obtener ubicación:', err)
    )
  }
})

// === Predicción de pasos visibles ===
async function calcPasses() {
  if (!lat.value || !lon.value) {
    alert('Introduce latitud y longitud válidas.')
    return
  }
  loading.value = true
  await store.fetchPasses(lat.value, lon.value)
  loading.value = false
}

// === Banderas ===
function getFlag(nat = '') {
  nat = nat.toLowerCase()
  if (nat.includes('american')) return 'https://flagcdn.com/us.svg'
  if (nat.includes('russian')) return 'https://flagcdn.com/ru.svg'
  if (nat.includes('japanese')) return 'https://flagcdn.com/jp.svg'
  if (nat.includes('europe')) return 'https://flagcdn.com/eu.svg'
  if (nat.includes('chinese')) return 'https://flagcdn.com/cn.svg'
  return 'https://flagcdn.com/un.svg'
}
</script>

<style scoped>
#right-panel {
  width: 40vw;
  height: calc(100vh - 80px);
  background: rgba(0, 13, 25, 0.8);
  padding: 20px;
  margin-top: 80px;
  color: #d4faff;
  overflow-y: auto;
  box-shadow: inset 0 0 20px #00ffee33;
  border-left: 2px solid #00ffee55;
  transition: width 0.3s ease;
}

.block {
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid #00ffee44;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 25px;
  transition: transform 0.25s ease, box-shadow 0.3s ease;
}
.block:hover {
  transform: translateY(-3px);
  box-shadow: 0 0 18px #00ffee66;
}
.block h2 {
  color: #00ffff;
  margin-top: 0;
  text-shadow: 0 0 10px #00ffee;
  font-size: 18px;
  cursor: pointer;
  user-select: none;
}

/* Animación colapsables */
.block-content {
  transition: max-height 0.45s ease, opacity 0.35s ease, padding 0.35s ease;
  overflow: hidden;
}
.block.collapsed .block-content {
  max-height: 0;
  opacity: 0;
  padding: 0;
}

.astronaut {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 8px 0;
  padding: 5px 8px;
  border-bottom: 1px solid #00ffee22;
}
.astronaut img:first-child {
  width: 22px;
  height: 15px;
  border-radius: 2px;
  border: none;
  object-fit: contain;
}
.astronaut img:nth-child(2) {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid #00ffee55;
  object-fit: cover;
  transition: transform 0.25s ease;
}
.astronaut:hover img:nth-child(2) {
  transform: scale(1.05);
}

.inputs {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}
.inputs input,
.inputs button {
  width: 100%;
  padding: 6px;
  border-radius: 5px;
  border: none;
  text-align: center;
  background: rgba(0, 255, 255, 0.1);
  color: #00ffff;
}
.inputs button {
  background: #00ffee33;
  cursor: pointer;
  font-weight: bold;
}
.inputs button:hover {
  background: #00ffee66;
}

footer {
  text-align: center;
  font-size: 12px;
  color: #00ffee;
  margin-top: 10px;
}
</style>
