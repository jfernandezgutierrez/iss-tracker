import assert from 'node:assert/strict'
import { chromium } from 'playwright'

// Mock transport only: no real accounts, tokens or results reach Supabase.
const base = process.env.GAMES_TEST_URL || 'http://localhost:3140'
const userId = '10000000-0000-4000-8000-000000000001'
const runId = '20000000-0000-4000-8000-000000000001'
const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const errors = []
try {
  for (const game of ['iss-runner', 'meteor-dodge', 'iss-docking']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' })
    let allowSave = false; let attempts = 0; let failProfile = false; let starts = 0
    await context.route('**/auth/v1/**', route => route.abort())
    await context.route('**/rest/v1/**', route => {
      const path = new URL(route.request().url()).pathname
      if(path.endsWith('/rpc/start_mapped_game')){starts++;return route.fulfill(failProfile?{status:503,json:{message:'Cuenta no disponible'}}:{json:{id:runId,seed:22,loadout:{}}})}
      if(failProfile&&path.endsWith('/profiles'))return route.fulfill({status:503,json:{message:'Perfil no disponible'}})
      const result = path.endsWith('/profiles') ? { username: 'Piloto de prueba' }
        : path.endsWith('/wallets') ? { currency_balance: allowSave ? 15 : 5 }
        : path.endsWith('/games') ? { id: '30000000-0000-4000-8000-000000000001' } : []
      return route.fulfill({ json: result })
    })
    await context.route('**/api/games/finish', async route => {
      attempts++
      const body = route.request().postDataJSON()
      assert.equal(body.runId, runId)
      assert.equal(body.ticks, game === 'meteor-dodge' ? 541 : 60)
      assert.equal(Object.hasOwn(body, 'coins'), false)
      await route.fulfill(allowSave ? { json: { coins: 10 } } : { status: 503, json: { statusMessage: 'Sin conexión de prueba. Reinténtalo.' } })
    })
    await context.addInitScript(({ game, userId, runId }) => {
      if (sessionStorage.getItem('recovery-seeded')) return
      sessionStorage.setItem('recovery-seeded', 'true')
      const payload = btoa(JSON.stringify({ sub: userId, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }))
      const session = { access_token: `eyJhbGciOiJIUzI1NiJ9.${payload}.test`, refresh_token: 'test-only', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: userId, aud: 'authenticated', role: 'authenticated', email: 'test@example.invalid', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() } }
      localStorage.setItem('sb-tdpskkhcanfhepljfpsr-auth-token', JSON.stringify(session))
      const events = game === 'iss-runner' ? [{ tick: 0, direction: 1, jump: true }] : [{ tick: 0, x: 0, y: 1, boost: false }]
      if(game !== 'meteor-dodge')localStorage.setItem(`iss-pending-${game}-${userId}-v1`, JSON.stringify({ runId, userId, startedAt: Date.now() - 2000, ticks: 60, events }))
    }, { game, userId, runId })
    const page = await context.newPage()
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${base}/juegos/${game}`)
    if(game === 'meteor-dodge')await page.getByRole('button',{name:'INICIAR PATRULLA',exact:false}).click()
    else await page.getByRole('button', { name: 'Guardar resultado', exact: true }).waitFor()
    await page.getByText('Sin conexión de prueba. Reinténtalo.', { exact: true }).waitFor()
    assert.ok(attempts > 0)
    const key = `iss-pending-${game}-${userId}-v1`
    assert.equal(await page.evaluate(key => !!localStorage.getItem(key), key), true)
    await page.reload()
    await page.getByText('Sin conexión de prueba. Reinténtalo.', { exact: true }).waitFor()
    assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).runId, key), runId)
    allowSave = true
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
    await page.getByRole('button', { name: 'Guardar resultado', exact: true }).waitFor({ state: 'hidden' })
    assert.equal(await page.evaluate(key => localStorage.getItem(key), key), null)
    await page.reload()
    const launch = page.getByRole('button', { name: game === 'iss-runner' ? 'COMENZAR VUELO' : game === 'meteor-dodge' ? 'INICIAR PATRULLA' : 'INICIAR APROXIMACIÓN', exact: false })
    await launch.waitFor()
    assert.equal(await page.getByRole('button', { name: 'Guardar resultado', exact: true }).count(), 0)
    failProfile = true
    await page.reload()
    await page.getByRole('button', { name: game === 'iss-runner' ? 'Volar como invitado' : 'Jugar como invitado', exact: true }).click()
    await page.getByRole('button', { name: 'Pausar', exact: true }).waitFor()
    assert.equal(starts, game === 'meteor-dodge' ? 1 : 0, 'Guest launch must not require the account service')
    await context.close()
    console.log(`${game}: failed save, reload recovery, reconnection retry, removal and guest launch during account failure passed`)
  }
  assert.deepEqual(errors, [])
} finally { await browser.close() }
