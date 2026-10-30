import { createClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'
export async function gameUser(event: H3Event) {
  const config = useRuntimeConfig(event)
  if (!config.public.supabaseUrl || !config.public.supabaseKey) throw createError({ statusCode: 503, statusMessage: 'El servicio de cuentas no está configurado.' })
  const authorization = getHeader(event, 'authorization') || ''
  if (!authorization.startsWith('Bearer ')) throw createError({ statusCode: 401, statusMessage: 'Inicia sesión.' })
  const token = authorization.slice(7)
  const supabase = createClient(String(config.public.supabaseUrl), String(config.public.supabaseKey), { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: authorization } } })
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) throw createError({ statusCode: 401, statusMessage: 'La sesión ha caducado.' })
  return { supabase, user: data.user, config }
}
