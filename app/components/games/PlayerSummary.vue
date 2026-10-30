<script setup lang="ts">
import { onMounted } from 'vue'
const account = useGameAccount()
onMounted(() => { account.init().catch(() => {}) })
</script>
<template>
  <section class="glass-card row" aria-label="Área del jugador">
    <div class="player-intro"><h2 class="section-title">{{ account.profile.value?.username || 'Explorador invitado' }}</h2><p class="text-soft">{{ account.session.value ? 'Tu progreso se guarda en tu cuenta.' : 'Juega sin registrarte o crea una cuenta para guardar tu progreso.' }}</p></div>
    <span v-if="account.session.value" class="badge">{{ account.balance.value }} monedas</span>
    <NuxtLink class="btn btn-secondary" to="/juegos/cuenta">{{ account.session.value ? 'Mi perfil' : 'Iniciar sesión / Registrarse' }}</NuxtLink>
  </section>
</template>
<style scoped>.player-intro { flex: 1 1 280px; }.player-intro p { margin-top: 8px; font-size: .9rem; }</style>
