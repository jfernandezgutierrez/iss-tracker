import { build } from 'esbuild'
import { spawnSync } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
await mkdir('.cache', { recursive: true })
await build({ entryPoints: ['tests/games.test.ts'], outfile: '.cache/games-tests.mjs', bundle: true, platform: 'node', format: 'esm' })
const run = spawnSync(process.execPath, ['--test', '.cache/games-tests.mjs'], { stdio: 'inherit' })
process.exitCode = run.status ?? 1
