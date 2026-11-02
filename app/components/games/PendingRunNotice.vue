<script setup lang="ts">
defineProps<{ busy: boolean; message: string }>()
defineEmits<{ retry: []; discard: [] }>()
</script>
<template>
  <aside class="pending-run" role="status" aria-label="Resultado pendiente de guardar">
    <strong>Tienes una partida pendiente</strong>
    <p>{{ message || 'Recuperamos tu resultado. Guárdalo antes de comenzar otra partida.' }}</p>
    <div><button :disabled="busy" @click="$emit('retry')">{{ busy ? 'Verificando…' : 'Guardar resultado' }}</button><button :disabled="busy" @click="$emit('discard')">Descartar</button></div>
  </aside>
</template>
<style scoped>
.pending-run{position:absolute;inset:0;z-index:6;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;background:#0a1a2bf5;text-align:center;color:#e4eeed}.pending-run strong{font-size:22px}.pending-run p{max-width:320px;color:#a8c7d0;font-size:13px;line-height:1.6}.pending-run div{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}.pending-run button{min-height:44px;padding:10px 16px;border:1px solid #527b7c;border-radius:12px;background:#28534f;color:#d7f4e9;cursor:pointer}.pending-run button:disabled{opacity:.5;cursor:wait}
</style>
