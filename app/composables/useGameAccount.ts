import { createClient, type SupabaseClient, type Session } from '@supabase/supabase-js'
let client: SupabaseClient | undefined
let initialization: Promise<void> | undefined
export function useGameAccount() {
  const session = useState<Session | null>('games-session', () => null)
  const ready = useState('games-auth-ready', () => false)
  const profile = useState<{ username: string } | null>('games-profile', () => null)
  const balance = useState('games-balance', () => 0)
  const levels = useState<Record<string, number>>('games-upgrades', () => ({}))
  const recovering = useState('games-recovery', () => false)
  const config = useRuntimeConfig()
  const configured = !!config.public.supabaseUrl && !!config.public.supabaseKey
  function getClient() {
    if (!import.meta.client || !configured) return null
    if (!client) client = createClient(String(config.public.supabaseUrl), String(config.public.supabaseKey), { auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
    return client
  }
  async function refresh() {
    const supabase = getClient()
    if (!supabase || !session.value) { profile.value = null; balance.value = 0; levels.value = {}; return }
    const userId = session.value.user.id
    const [player, wallet, equipment] = await Promise.all([
      supabase.from('profiles').select('username').eq('id', userId).single(),
      supabase.from('wallets').select('currency_balance').eq('user_id', userId).single(),
      supabase.from('user_upgrades').select('level, upgrades(key)').eq('user_id', userId),
    ])
    if (player.error || wallet.error || equipment.error) throw new Error('No se pudo cargar tu perfil. Inténtalo de nuevo.')
    // Ignore responses belonging to a session that ended while the request was in flight.
    if (session.value?.user.id !== userId) return
    profile.value = player.data
    balance.value = wallet.data.currency_balance
    levels.value = Object.fromEntries((equipment.data || []).map((row: any) => [row.upgrades.key, row.level]))
  }
  async function init() {
    if (!import.meta.client) return
    if (!initialization) initialization = (async () => {
      const supabase = getClient()
      if (!supabase) { ready.value = true; return }
      supabase.auth.onAuthStateChange((event, value) => {
        session.value = value
        if (event === 'PASSWORD_RECOVERY') recovering.value = true
        // Do not await Supabase requests inside its auth callback.
        setTimeout(() => { refresh().catch(() => {}) }, 0)
      })
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        session.value = data.session
        await refresh()
      } finally { ready.value = true }
    })()
    return initialization
  }
  async function accessToken() {
    const supabase = getClient()
    const { data, error } = await supabase!.auth.getSession()
    if (error || !data.session) throw new Error('Inicia sesión para guardar tu progreso.')
    return data.session.access_token
  }
  return { session, ready, profile, balance, levels, recovering, configured, getClient, init, refresh, accessToken }
}
