<script setup lang="ts">
import { ref, onMounted } from 'vue'
const account = useGameAccount()
const rows = ref<{ id: string; score: number; distance: number; profiles: { username: string } }[]>([])
const errorMessage = ref('')
async function load() {
  errorMessage.value = ''
  try {
    await account.init()
    const client = account.getClient()
    if (!client) return
    const { data, error } = await client.from('game_scores').select('id,score,distance,profiles(username),games!inner(slug)').eq('games.slug', 'iss-runner').eq('verification_status', 'replayed').order('score', { ascending: false }).order('created_at', { ascending: true }).limit(10)
    if (error) throw error
    rows.value = data as any
  } catch { errorMessage.value = 'No se pudo cargar la clasificación.' }
}
onMounted(load)
</script>
<template>
  <section class="panel-card stack" aria-labelledby="ranking-title">
    <div class="row"><h2 id="ranking-title" class="section-title">Mejores misiones</h2><button class="btn btn-ghost" @click="load">Actualizar</button></div>
    <p class="text-soft">Resultados reproducidos en el servidor. Una verificación de movimientos no impide el uso de bots.</p>
    <p v-if="errorMessage" role="status">{{ errorMessage }}</p>
    <ol v-else-if="rows.length"><li v-for="row in rows" :key="row.id"><strong>{{ row.profiles.username }}</strong> · {{ row.score }} puntos · {{ row.distance }} m</li></ol>
    <p v-else class="text-soft">Todavía no hay resultados verificados. ¡Completa la primera misión!</p>
  </section>
</template>
<style scoped>li { padding: 8px 0; }</style>
