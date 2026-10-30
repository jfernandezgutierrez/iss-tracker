<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { upgradeCatalog } from '#shared/games/config'
const account = useGameAccount()
const busy = ref('')
const message = ref('')
const requestIds = new Map<string, string>()
onMounted(() => account.init().catch(() => {}))
async function buy(key: string) {
  if (busy.value) return
  busy.value = key; message.value = ''
  if (!requestIds.has(key)) requestIds.set(key, crypto.randomUUID())
  try {
    const { error } = await account.getClient()!.rpc('purchase_game_upgrade', { p_key: key, p_request: requestIds.get(key) })
    if (error) { if (error.code === 'P0001' || error.code === '42501') requestIds.delete(key); throw new Error(error.message) }
    requestIds.delete(key)
    await account.refresh(); message.value = 'Mejora comprada. Se aplicará en tu próxima partida.'
  } catch (error) { message.value = error instanceof Error ? error.message : 'No se pudo comprar. Reintenta con el mismo identificador.' }
  finally { busy.value = '' }
}
</script>
<template>
  <section class="stack-lg" aria-labelledby="shop-title">
    <div><h2 id="shop-title" class="section-title">Tienda de la misión</h2><p class="section-subtitle">Usa las monedas ganadas jugando. Los precios aumentan con cada nivel.</p></div>
    <p v-if="!account.session.value" class="text-soft">Inicia sesión para comprar y conservar mejoras. Las partidas de invitado no generan saldo en la nube.</p>
    <p v-else>Saldo: <strong>{{ account.balance.value }} monedas</strong></p>
    <div class="shop-grid">
      <article v-for="upgrade in upgradeCatalog" :key="upgrade.key" class="glass-card stack">
        <h3>{{ upgrade.name }}</h3><p class="text-soft">{{ upgrade.description }}</p>
        <span>Nivel {{ account.levels.value[upgrade.key] || 0 }} / {{ upgrade.maxLevel }}</span>
        <button class="btn btn-secondary" :disabled="!account.session.value || !!busy || (account.levels.value[upgrade.key] || 0) >= upgrade.maxLevel || account.balance.value < upgrade.price * ((account.levels.value[upgrade.key] || 0) + 1)" @click="buy(upgrade.key)">{{ (account.levels.value[upgrade.key] || 0) >= upgrade.maxLevel ? 'Al máximo' : busy === upgrade.key ? 'Comprando…' : `${upgrade.price * ((account.levels.value[upgrade.key] || 0) + 1)} monedas · Comprar` }}</button>
      </article>
    </div>
    <p v-if="message" role="status">{{ message }}</p>
  </section>
</template>
<style scoped>.shop-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 16px; }.shop-grid article p { flex: 1; }</style>
