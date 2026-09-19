import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const read = (path:string) => readFile(new URL('../../'+path, import.meta.url), 'utf8')

describe('website protected page contract', () => {
  it('never embeds protected page content in the static deployment artifact', async () => {
    const source=await read('app/api/websites/route.ts')
    expect(source).toContain('protectedPageShell')
    expect(source).toContain("action==='runtime-page'")
    expect(source).toMatch(/pageAccessMode\(page\)==='public'\?renderPublishedPage[^:]+:protectedPageShell/)
  })

  it('authorizes role and assigned pages on the backend', async () => {
    const source=await read('app/api/websites/route.ts')
    expect(source).toContain("if(mode==='role')")
    expect(source).toContain("if(mode==='assigned')")
    expect(source).toContain('runtimeMember(site.id,token)')
  })
})

describe('agent security contracts', () => {
  it('keeps path traversal blocking in the node agent', async () => {
    const source=await read('agent/src/index.ts')
    expect(source).toContain('function safePath')
    expect(source).toContain('Path traversal blocked')
    expect(source).toContain("normalized.startsWith('/')")
  })

  it('uses constant-time comparison where secrets are checked', async () => {
    const source=await read('agent/src/index.ts')
    expect(source).toContain('timingSafeEqual')
  })
})
