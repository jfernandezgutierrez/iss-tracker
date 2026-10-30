<script setup lang="ts">
import PlayerAccount from '../../components/games/PlayerAccount.vue'
definePageMeta({ layout: 'games' })
useHead({ title: 'Cuenta de jugador', meta: [{ name: 'robots', content: 'noindex, nofollow' }], link: [{ rel: 'canonical', href: 'https://isstrackerlive.es/juegos/cuenta' }] })
</script>
<template><main class="container account-page stack-lg"><h1>Tu cuenta espacial</h1><PlayerAccount /><NuxtLink to="/juegos">← Volver a los juegos</NuxtLink></main></template>
<style scoped>.account-page { max-width: 800px; padding-top: 32px; padding-bottom: 48px; }</style>
