<script setup lang="ts">
import { computed } from 'vue'
import { flightMissions, type MissionProgress } from '#shared/games/missions'
import GameIcon from './GameIcon.vue'
const props=defineProps<{ progress: MissionProgress; verified: boolean }>()
const completed=computed(()=>flightMissions.filter(m=>(props.progress[m.key]||0)>=m.target).length)
</script>
<template>
 <section class="mission-board stack" aria-labelledby="missions-title">
  <div class="mission-heading"><div><p class="board-eyebrow">Tu siguiente objetivo</p><h2 id="missions-title">Misiones de vuelo</h2></div><span class="mission-count">{{ completed }}/3</span></div>
  <p class="mission-note">{{ verified ? 'El progreso de tu cuenta se actualiza después de validar cada vuelo.' : 'Progreso de invitado guardado en este dispositivo. Las medallas no conceden monedas.' }}</p>
  <article v-for="(mission,index) in flightMissions" :key="mission.key" class="mission-card" :class="{ complete: (progress[mission.key]||0)>=mission.target }">
   <div class="mission-symbol"><GameIcon :name="mission.icon === 'coin' ? 'coin' : mission.icon === 'orbit' ? 'orbit' : 'shield'" :size="28" /></div>
   <div class="mission-body"><span class="mission-number">MISIÓN 0{{ index+1 }}</span><h3>{{ mission.title }}</h3><p>{{ mission.description }}</p><progress :value="Math.min(progress[mission.key]||0,mission.target)" :max="mission.target" :aria-label="mission.title" /><span>{{ Math.min(progress[mission.key]||0,mission.target) }} / {{ mission.target }}</span></div>
   <span class="mission-medal" :aria-label="(progress[mission.key]||0)>=mission.target ? 'Completada' : 'Pendiente'">{{ (progress[mission.key]||0)>=mission.target ? '✓' : '○' }}</span>
  </article>
 </section>
</template>
<style scoped>
.mission-heading{display:flex;justify-content:space-between;align-items:center;gap:12px}.board-eyebrow,.mission-number{font-size:10px;color:#74c7d5;letter-spacing:.16em;text-transform:uppercase;font-weight:800}.mission-heading h2{margin-top:6px;font-size:1.65rem}.mission-count{font-size:1.6rem;font-weight:900;color:#f6c879}.mission-note{color:#91a8bd;font-size:.84rem}.mission-card{display:flex;align-items:center;gap:14px;padding:18px;background:#142b40;border:1px solid #2b465c;border-radius:18px}.mission-card.complete{border-color:#508f84}.mission-symbol{padding:12px;background:#214356;color:#77e4d4;border-radius:14px}.mission-body{flex:1;min-width:0}.mission-body h3{font-size:1rem;margin:4px 0}.mission-body p,.mission-body span{font-size:.78rem;color:#9bb2c5}.mission-body progress{display:block;width:100%;height:7px;margin:10px 0 4px;accent-color:#67ddc8}.mission-medal{font-size:1.5rem;color:#6be0c8}
</style>
