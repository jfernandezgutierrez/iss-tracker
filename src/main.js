// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia' // 👈 importa Pinia
import App from './App.vue'
import '@/assets/styles/theme.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia) // 👈 registra Pinia en la instancia principal

app.mount('#app')
