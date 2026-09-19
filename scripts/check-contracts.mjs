import { readFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import assert from 'node:assert/strict'

const read = path => readFile(new URL('../'+path, import.meta.url), 'utf8')
const websiteRoute = await read('app/api/websites/route.ts')
const siteAuthRoute = await read('app/api/site-auth/route.ts')
const agent = await read('agent/src/index.ts')
const serverActions = await read('app/api/server-actions/route.ts')
const pkg = JSON.parse(await read('package.json'))

assert.match(websiteRoute, /protectedPageShell/)
assert.match(websiteRoute, /action==='runtime-page'/)
assert.match(websiteRoute, /memberCanAccess/)
assert.match(websiteRoute, /pageAccessMode\(page\)==='public'\?renderPublishedPage[^:]+:protectedPageShell/)
assert.match(websiteRoute, /Cache-Control':'private, no-store/)
assert.match(siteAuthRoute, /scrypt/)
assert.match(siteAuthRoute, /timingSafeEqual/)
assert.match(agent, /function safePath/)
assert.match(agent, /Path traversal blocked/)
assert.match(agent, /timingSafeEqual/)
assert.match(serverActions, /IMPLEMENTED_AGENT_ACTIONS/)
assert.equal(pkg.scripts?.typecheck, 'tsc --noEmit')
assert.ok(pkg.scripts?.['agent:build'])
assert.ok(pkg.scripts?.['test:unit'])

const migrationsDir = new URL('../migrations/', import.meta.url)
if (existsSync(migrationsDir)) {
  const migrations = (await readdir(migrationsDir)).filter(x=>/^\d{4}_.+\.sql$/.test(x)).sort()
  assert.ok(migrations.length >= 14, 'Beklenen migration zinciri eksik')
  for (let i=0;i<migrations.length;i++) {
    const expected=String(i+1).padStart(4,'0')+'_'
    assert.ok(migrations[i].startsWith(expected), 'Migration sırası bozuk: '+migrations[i])
  }
}
console.log('BlockCtrl contract checks passed')
