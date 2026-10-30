<script setup lang="ts">
import { ref, onMounted } from 'vue'
const account = useGameAccount()
const mode = ref<'login' | 'register' | 'reset'>('login')
const email = ref('')
const password = ref('')
const username = ref('')
const message = ref('')
const errorMessage = ref('')
const busy = ref(false)
const editing = ref(false)
onMounted(() => { account.init().catch(() => { errorMessage.value = 'No se pudo cargar tu cuenta.' }) })
function showError(error: unknown) {
  const text = error instanceof Error ? error.message : String(error)
  if (/Invalid login credentials/i.test(text)) return 'Correo o contraseña incorrectos.'
  if (/Email not confirmed/i.test(text)) return 'Confirma tu correo antes de iniciar sesión.'
  if (/rate limit/i.test(text)) return 'Demasiados intentos. Espera unos minutos.'
  if (/duplicate|database error/i.test(text)) return 'No se pudo guardar el perfil. Prueba otro nombre de jugador.'
  return text
}
async function submit() {
  message.value = ''; errorMessage.value = ''; busy.value = true
  try {
    const supabase = account.getClient()
    if (!supabase) throw new Error('El servicio de cuentas no está configurado.')
    const redirectTo = `${window.location.origin}/juegos/cuenta`
    if (account.recovering.value) {
      const { error } = await supabase.auth.updateUser({ password: password.value })
      if (error) throw error
      account.recovering.value = false; password.value = ''; message.value = 'Contraseña actualizada.'
    } else if (editing.value && account.session.value) {
      const name = username.value.trim().toLowerCase()
      if (!/^[a-z0-9_]{3,20}$/.test(name)) throw new Error('Usa entre 3 y 20 letras, números o guiones bajos.')
      const { error } = await supabase.from('profiles').update({ username: name }).eq('id', account.session.value.user.id)
      if (error) throw error
      await account.refresh(); editing.value = false; message.value = 'Perfil actualizado.'
    } else if (mode.value === 'reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(email.value, { redirectTo })
      if (error) throw error
      message.value = 'Si el correo tiene una cuenta, recibirás un enlace para cambiar la contraseña.'
    } else if (mode.value === 'register') {
      const name = username.value.trim().toLowerCase()
      if (!/^[a-z0-9_]{3,20}$/.test(name)) throw new Error('Usa entre 3 y 20 letras, números o guiones bajos.')
      const { data, error } = await supabase.auth.signUp({ email: email.value, password: password.value, options: { data: { username: name }, emailRedirectTo: redirectTo } })
      if (error) throw error
      message.value = data.session ? 'Cuenta creada.' : 'Revisa tu correo para confirmar el registro. Si ya tienes cuenta, inicia sesión.'
      password.value = ''
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
      if (error) throw error
      password.value = ''; await account.refresh()
    }
  } catch (error) { errorMessage.value = showError(error) }
  finally { busy.value = false }
}
async function signOut() {
  busy.value = true; errorMessage.value = ''
  try { const { error } = await account.getClient()!.auth.signOut(); if (error) throw error; account.recovering.value = false; await account.refresh() }
  catch (error) { errorMessage.value = showError(error) }
  finally { busy.value = false }
}
</script>

<template>
  <section class="panel-card stack-lg" aria-labelledby="account-title">
    <h2 id="account-title">{{ account.recovering.value ? 'Nueva contraseña' : account.session.value ? 'Tu perfil' : 'Cuenta de jugador' }}</h2>
    <p v-if="!account.configured" class="text-soft">Las cuentas no están disponibles en este entorno. Puedes jugar como invitado.</p>
    <template v-else-if="account.session.value && !account.recovering.value && !editing">
      <p>Jugador: <strong>{{ account.profile.value?.username || 'Cargando perfil…' }}</strong></p>
      <p>{{ account.balance.value }} monedas · Tus mejoras se guardan en la nube.</p>
      <div class="row"><button class="btn btn-secondary" :disabled="busy" @click="editing = true; username = account.profile.value?.username || ''">Editar nombre</button><button class="btn btn-ghost" :disabled="busy" @click="signOut">Cerrar sesión</button></div>
    </template>
    <form v-else-if="account.configured" class="stack" @submit.prevent="submit">
      <div v-if="!account.recovering.value && !editing" class="row" aria-label="Opciones de cuenta">
        <button v-for="option in (['login', 'register', 'reset'] as const)" :key="option" type="button" class="btn btn-secondary" :aria-pressed="mode === option" :disabled="busy" @click="mode = option; message = ''; errorMessage = ''">{{ option === 'login' ? 'Iniciar sesión' : option === 'register' ? 'Registrarse' : 'Recuperar contraseña' }}</button>
      </div>
      <label v-if="!account.recovering.value && !editing">Correo electrónico<input v-model="email" type="email" autocomplete="email" required maxlength="254"></label>
      <label v-if="(mode === 'register' && !account.recovering.value) || editing">Nombre público de jugador<input v-model="username" type="text" autocomplete="nickname" required minlength="3" maxlength="20" pattern="[A-Za-z0-9_]{3,20}" aria-describedby="username-help"><span id="username-help">Entre 3 y 20 letras, números o guiones bajos.</span></label>
      <label v-if="(mode !== 'reset' || account.recovering.value) && !editing">Contraseña<input v-model="password" type="password" :autocomplete="mode === 'register' || account.recovering.value ? 'new-password' : 'current-password'" required minlength="8" maxlength="128"></label>
      <button class="btn btn-primary" type="submit" :disabled="busy">{{ busy ? 'Procesando…' : account.recovering.value ? 'Guardar contraseña' : editing ? 'Guardar nombre' : mode === 'register' ? 'Crear cuenta' : mode === 'reset' ? 'Enviar enlace' : 'Entrar' }}</button>
      <button v-if="editing" type="button" class="btn btn-ghost" @click="editing = false">Cancelar</button>
      <p class="text-soft">Puedes jugar como invitado. Solo una cuenta permite guardar monedas, mejoras y resultados verificados.</p>
    </form>
    <p v-if="message" role="status">{{ message }}</p><p v-if="errorMessage" role="alert" class="soft-error">{{ errorMessage }}</p>
  </section>
</template>
<style scoped>
input[type='password'] { width: 100%; padding: 12px 14px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface-3); color: var(--text); font: inherit; }
label span { display: block; margin-top: 6px; font-size: .8rem; }
</style>
