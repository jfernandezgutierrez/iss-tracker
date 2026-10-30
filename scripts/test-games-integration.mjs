import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'
import { build } from 'esbuild'
const env = Object.fromEntries((await readFile('.env', 'utf8')).replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.includes('=')).map(line => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]))
const fixture = JSON.parse((await readFile(process.env.GAMES_TEST_ACCOUNTS || '.cache/test-accounts.json', 'utf8')).replace(/^\uFEFF/, ''))
const a = createClient(env.NUXT_PUBLIC_SUPABASE_URL, env.NUXT_PUBLIC_SUPABASE_KEY, { auth: { persistSession: false } })
const b = createClient(env.NUXT_PUBLIC_SUPABASE_URL, env.NUXT_PUBLIC_SUPABASE_KEY, { auth: { persistSession: false } })
const anon = createClient(env.NUXT_PUBLIC_SUPABASE_URL, env.NUXT_PUBLIC_SUPABASE_KEY, { auth: { persistSession: false } })
for (const [client, email] of [[a, fixture.emailA], [b, fixture.emailB]]) {
  const { error } = await client.auth.signInWithPassword({ email, password: fixture.password })
  assert.equal(error, null, 'fixture login failed')
}
assert.equal((await a.from('wallets').select('*').eq('user_id', fixture.userB)).data.length, 0)
assert.equal((await b.from('wallets').select('*').eq('user_id', fixture.userA)).data.length, 0)
assert.equal((await a.from('profiles').update({ username: 'intruder_name' }).eq('id', fixture.userB).select()).data.length, 0)
assert.ok((await a.from('profiles').update({ username: 'bad name!' }).eq('id', fixture.userA)).error)
assert.ok((await a.from('wallets').update({ currency_balance: 999999 }).eq('user_id', fixture.userA)).error)
assert.ok((await a.from('game_scores').insert({ score: 99999 })).error)
assert.ok((await a.from('user_upgrades').insert({ user_id: fixture.userA, level: 10 })).error)
assert.ok((await anon.rpc('start_game_run')).error)
assert.ok((await anon.rpc('purchase_game_upgrade', { p_key: 'shield', p_request: crypto.randomUUID() })).error)
const before = (await a.from('wallets').select('currency_balance').single()).data.currency_balance
const request = crypto.randomUUID()
const purchases = await Promise.all(Array.from({ length: 5 }, () => a.rpc('purchase_game_upgrade', { p_key: 'shield', p_request: request })))
assert.ok(purchases.every(result => !result.error))
const after = (await a.from('wallets').select('currency_balance').single()).data.currency_balance
assert.equal(after, before - 50, 'duplicate purchases must charge only once')
assert.ok((await a.rpc('purchase_game_upgrade', { p_key: 'oxygen', p_request: request })).error)
const { data: run, error } = await a.rpc('start_game_run')
assert.equal(error, null)
assert.equal(run.loadout.shield, 1)
assert.equal((await b.from('game_sessions').select('*').eq('id', run.id)).data.length, 0)
assert.ok((await a.rpc('finish_game_run', { p_run: run.id, p_score: 10, p_coins: 1, p_distance: 0, p_ticks: 1, p_proof: 'forged' })).error)
await build({ entryPoints: ['shared/games/runner.ts'], outfile: '.cache/runner-core.mjs', bundle: true, platform: 'node', format: 'esm' })
const { createRunner, stepRunner, runnerResult } = await import('../.cache/runner-core.mjs')
const state = createRunner(run.seed, run.loadout)
while (!state.dead) stepRunner(state, { direction: 1, jump: false })
const payload = { runId: run.id, ticks: state.tick, events: [{ tick: 0, direction: 1, jump: false }] }
const tokenA = (await a.auth.getSession()).data.session.access_token
const tokenB = (await b.auth.getSession()).data.session.access_token
const base = process.env.GAMES_TEST_URL || 'http://localhost:3103'
const call = (body, token) => fetch(`${base}/api/games/finish`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) })
assert.equal((await call(payload)).status, 401)
assert.equal((await call(payload, tokenB)).status, 404)
assert.equal((await call({ ...payload, ticks: 36001 }, tokenA)).status, 422)
const wait = Math.max(0, state.tick / 60 * 1000 - (Date.now() - Date.parse(run.started_at))) + 200
await new Promise(resolve => setTimeout(resolve, wait))
const first = await call(payload, tokenA)
assert.equal(first.status, 200, await first.clone().text())
const result = await first.json()
assert.equal(result.score, runnerResult(state).score)
const duplicates = await Promise.all(Array.from({ length: 4 }, () => call(payload, tokenA)))
assert.ok(duplicates.every(response => response.status === 200))
const final = (await a.from('wallets').select('currency_balance').single()).data.currency_balance
assert.equal(final, after + state.coins)
const transactions = (await a.from('wallet_transactions').select('*').eq('request_id', run.id)).data
assert.equal(transactions.length, 1)
await a.auth.signOut(); await b.auth.signOut()
console.log('Supabase integration passed: real login, RLS isolation, mutation denial, replay validation, concurrent purchase and reward idempotency, sign-out.')
