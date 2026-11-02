<script setup lang="ts">
const props=withDefaults(defineProps<{ name: string; size?: number }>(),{size:24})
const paths:Record<string,string>={
 play:'m9 5 11 7-11 7Z',pause:'M8 5v14M16 5v14',rocket:'M5 16c-2 0-3 3-3 5 2 0 5-1 5-3M14 5l5-2 2 2-2 5-8 8-5-5Z M13 7l4 4M6 13l-3-1 4-5h5M11 18l1 3 5-4v-5',
 coin:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v10M9 9h6M9 15h6',
 missions:'M5 4h14v17H5ZM9 2h6v4H9ZM8 10l2 2 5-5M8 16h8',
 shop:'M3 8h18l-2-5H5ZM4 8v13h16V8M9 21v-7h6v7',
 trophy:'M8 3h8v7a4 4 0 0 1-8 0ZM8 5H4v3a4 4 0 0 0 4 4M16 5h4v3a4 4 0 0 1-4 4M12 14v6M8 21h8',
 home:'m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7',close:'m6 6 12 12M6 18 18 6',
 shield:'m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6ZM8 12l3 3 5-6',
 sound:'M4 9h4l5-5v16l-5-5H4ZM17 8c3 2 3 6 0 8M19 4c6 4 6 12 0 16',
 fullscreen:'M3 9V3h6M15 3h6v6M21 15v6h-6M9 21H3v-6',
 gear:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',
 orbit:'M20 12a8 8 0 1 1-8-8M2 16C-1 10 17-2 22 6S7 24 2 16M18 2l4 4-5 2',
}
</script>
<template><svg :width="props.size" :height="props.size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[name] || paths.rocket" /></svg></template>
