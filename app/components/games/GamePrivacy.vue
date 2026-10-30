<script setup lang="ts">
import { ref, onMounted } from 'vue'
const preference = ref('denied')
const message = ref('')
onMounted(() => { try { preference.value = localStorage.getItem('iss-games-ad-consent-v1') || 'denied' } catch {} })
function choose(value: string) { preference.value = value; try { localStorage.setItem('iss-games-ad-consent-v1', value); message.value = 'Preferencia guardada. Puedes cambiarla cuando quieras.' } catch { message.value = 'No se pudo guardar la preferencia en este dispositivo.' } }
</script>
<template><details class="glass-card"><summary>Privacidad y preferencias del portal</summary><div class="stack preferences"><p>La publicidad del portal está desactivada. No se carga Monetag ni se conceden recompensas publicitarias. Tu decisión no afecta al acceso a los juegos.</p><p>La sesión de cuenta y tu preferencia de sonido se guardan en este dispositivo. Con una cuenta almacenamos tu nombre público, resultados verificados, movimientos de la partida durante la validación, monedas y compras. El correo se gestiona en Supabase Auth y no aparece en la clasificación.</p><p>Publicidad opcional: {{ preference === 'granted' ? 'permitida' : 'rechazada' }}. Antes de activar un proveedor real se revisarán los formatos, la información de privacidad y el consentimiento necesario.</p><div class="row"><button class="btn btn-secondary" @click="choose('denied')">Rechazar publicidad opcional</button><button class="btn btn-ghost" @click="choose('granted')">Permitir publicidad opcional</button></div><p v-if="message" role="status">{{ message }}</p><NuxtLink to="/privacy-policy">Política de privacidad</NuxtLink></div></details></template>
<style scoped>summary { cursor: pointer; }.preferences { margin-top: 16px; }p { color: var(--text-soft); }</style>
