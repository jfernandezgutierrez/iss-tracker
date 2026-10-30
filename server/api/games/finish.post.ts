import { createHmac } from 'node:crypto'
import { replayRunner } from '#shared/games/runner'
import { RULES_VERSION } from '#shared/games/config'
import { gameUser } from '../../utils/gameUser'
export default defineEventHandler(async (event) => {
  if (Number(getHeader(event, 'content-length') || 0) > 2_500_000) throw createError({ statusCode: 413, statusMessage: 'Registro demasiado grande.' })
  const { supabase, user, config } = await gameUser(event)
  if (!config.gameVerificationSecret) throw createError({ statusCode: 503, statusMessage: 'Guardado oficial pendiente de configuración. Puedes jugar como invitado.' })
  const raw = await readRawBody(event)
  if (!raw || raw.length > 2_500_000) throw createError({ statusCode: 413, statusMessage: 'Registro inválido.' })
  let body
  try { body = JSON.parse(raw) } catch { throw createError({ statusCode: 400, statusMessage: 'Registro inválido.' }) }
  if (!body || typeof body.runId !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.runId)) throw createError({ statusCode: 400, statusMessage: 'Partida inválida.' })
  const { data: run, error } = await supabase.from('game_sessions').select('*').eq('id', body.runId).eq('user_id', user.id).single()
  if (error || !run) throw createError({ statusCode: 404, statusMessage: 'Partida desconocida.' })
  if (run.result) return run.result
  if (run.rules_version !== RULES_VERSION) throw createError({ statusCode: 409, statusMessage: 'La versión de la partida ha cambiado. Inicia otra partida.' })
  let result
  try { result = replayRunner(run.seed, run.loadout, body.events, body.ticks) }
  catch (error) { throw createError({ statusCode: 422, statusMessage: error instanceof Error ? error.message : 'Partida inválida.' }) }
  const payload = [run.id, user.id, result.score, result.coins, result.distance, result.ticks].join(':')
  const proof = createHmac('sha256', String(config.gameVerificationSecret)).update(payload).digest('hex')
  const { data, error: finishError } = await supabase.rpc('finish_game_run', { p_run: run.id, p_score: result.score, p_coins: result.coins, p_distance: result.distance, p_ticks: result.ticks, p_proof: proof })
  if (finishError) throw createError({ statusCode: 422, statusMessage: 'No se pudo validar la duración o guardar esta partida.' })
  return data
})
