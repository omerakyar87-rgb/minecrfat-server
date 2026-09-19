import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')
const fail = (message) => { console.error('SECURITY CONTRACT FAILED: ' + message); process.exitCode = 1 }
const must = (source, needle, label) => { if (!source.includes(needle)) fail(label + ': missing ' + needle) }

const websites = read('app/api/websites/route.ts')
const agent = read('agent/src/index.ts')
const nextConfig = read('next.config.mjs')

must(websites, 'protectedPageShell', 'protected website pages')
must(websites, "action==='runtime-page'", 'protected website pages')
must(websites, "pageAccessMode(page)==='public'?renderPublishedPage", 'protected website pages')
must(websites, "Cache-Control':'private, no-store", 'protected page cache policy')
must(websites, "'Vary':'Authorization'", 'protected page cache policy')
must(agent, 'Path traversal blocked', 'agent path traversal')
must(agent, 'timingSafeEqual', 'agent token verification')
must(nextConfig, 'Content-Security-Policy-Report-Only', 'CSP rollout')

if (!process.exitCode) console.log('Security contracts OK')
