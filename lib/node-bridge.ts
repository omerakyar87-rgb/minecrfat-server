import 'server-only'

import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { agentCommands, servers } from '@/lib/db/schema'

const REQUEST_TIMEOUT_MS = 8_000
const BRIDGE_TIMEOUT_MS = 20_000

function isPrivateOrMetadataHost(hostname: string) {
  const host = hostname.toLowerCase()
  return host === 'localhost' || host === 'metadata.google.internal' || host === '169.254.169.254' || host === '::1' || /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
}

type NodeConfig = { baseUrl: string; token: string }

function parseMap(name: string): Record<string, string> {
  const raw = process.env[name]?.trim()
  if (!raw) return {}
  try {
    const value = JSON.parse(raw) as Record<string, unknown>
    if (value && typeof value === 'object' && !Array.isArray(value)) return Object.fromEntries(Object.entries(value).filter(([, item]) => typeof item === 'string' && item.trim())) as Record<string, string>
  } catch {
    const entries = raw.split(/\r?\n|,/).map((entry) => entry.trim()).filter(Boolean).map((entry) => { const separator = entry.indexOf('=') >= 0 ? entry.indexOf('=') : entry.indexOf(':'); return separator > 0 ? [entry.slice(0, separator).trim(), entry.slice(separator + 1).trim()] : ['', ''] }).filter(([key, value]) => key && value)
    if (entries.length) return Object.fromEntries(entries)
  }
  throw new Error(`${name} JSON veya nodeId=değer biçiminde olmalı`)
}

function nodeToken(nodeId: string): string {
  const direct = process.env.NODE_TOKEN?.trim()
  const raw = process.env.NODE_TOKENS?.trim()
  if (!raw) return direct ?? ''

  try {
    const value = JSON.parse(raw) as unknown
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const mapped = (value as Record<string, unknown>)[nodeId]
      if (typeof mapped === 'string' && mapped.trim()) return mapped.trim()
      return direct ?? ''
    }
  } catch {
    const entries = raw.split(/\r?\n|,/).map((entry) => entry.trim()).filter(Boolean)
    for (const entry of entries) {
      const equal = entry.indexOf('=')
      const colon = entry.indexOf(':')
      const separator = equal >= 0 ? equal : colon
      if (separator <= 0) continue
      const key = entry.slice(0, separator).trim()
      const value = entry.slice(separator + 1).trim()
      if (key === nodeId && value) return value
    }

    // Backwards compatibility for single-node Vercel setups where NODE_TOKENS
    // was configured with the token itself instead of a JSON/map value.
    if (entries.length === 1 && !raw.startsWith('{') && !raw.startsWith('[')) return raw
  }

  return direct ?? ''
}

export function getNodeConfig(nodeId: string): NodeConfig {
  const urls = parseMap('NODE_AGENT_URLS')
  const legacyUrl = process.env.NODE_UPLOAD_URL ?? process.env.NODE_DOWNLOAD_URL
  const configuredUrl = process.env.NODE_AGENT_BASE_URL ?? legacyUrl
  const baseUrl = (urls[nodeId] ?? configuredUrl ?? '').trim().replace(/\/$/, '')
  const token = nodeToken(nodeId)
  if (!baseUrl) throw new Error(`Node ${nodeId} için NODE_AGENT_URLS veya NODE_AGENT_BASE_URL tanımlı değil`)
  if (!token) throw new Error(`Node ${nodeId} için NODE_TOKENS veya NODE_TOKEN tanımlı değil`)
  let parsed: URL
  try { parsed = new URL(baseUrl) } catch { throw new Error(`Node ${nodeId} adresi geçersiz`) }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Node adresi HTTP veya HTTPS olmalı')
  if (isPrivateOrMetadataHost(parsed.hostname)) throw new Error('Node adresi private veya metadata ağına ait olamaz')
  return { baseUrl, token }
}

function placeholderAgentUrl(baseUrl: string) {
  try {
    const host = new URL(baseUrl).hostname.toLowerCase()
    return host === 'agent.example.com' || host === 'example.com' || host.endsWith('.example.com') || host.endsWith('.invalid')
  } catch {
    return true
  }
}

function bridgeBody(init: RequestInit) {
  if (init.body == null) return {} as Record<string, unknown>
  if (typeof init.body !== 'string') throw new Error('Bu agent işlemi polling köprüsü üzerinden taşınamıyor.')
  try {
    const parsed = JSON.parse(init.body)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {}
  } catch {
    throw new Error('Agent polling köprüsü yalnız JSON gövdeli işlemleri destekliyor.')
  }
}

async function commandBridgeFetch(nodeId: string, path: string, init: RequestInit = {}) {
  const method = String(init.method || 'GET').toUpperCase()
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(method)) throw new Error(`Agent polling köprüsü ${method} isteğini desteklemiyor.`)
  const url = new URL(path.startsWith('/') ? path : `/${path}`, 'http://blockctrl-agent.local')
  if (!url.pathname.startsWith('/internal/')) throw new Error('Agent polling köprüsü yalnız internal agent yollarını destekliyor.')
  const body = bridgeBody(init)
  const serverId = String(url.searchParams.get('serverId') ?? body.serverId ?? '')
  if (!/^[0-9a-f-]{36}$/i.test(serverId)) throw new Error('Agent polling köprüsü için geçerli serverId gerekli.')

  const server = (await db.select({ id: servers.id, userId: servers.userId, nodeId: servers.nodeId }).from(servers).where(and(eq(servers.id, serverId), eq(servers.nodeId, nodeId))).limit(1))[0]
  if (!server) throw new Error('Agent polling köprüsü için sunucu/node eşleşmesi bulunamadı.')

  const [command] = await db.insert(agentCommands).values({
    userId: server.userId,
    nodeId,
    serverId,
    type: 'bridge-request',
    payload: {
      path: url.pathname + url.search,
      method,
      body,
    },
  }).returning({ id: agentCommands.id })
  if (!command) throw new Error('Agent polling köprüsü komutu oluşturulamadı.')

  const deadline = Date.now() + BRIDGE_TIMEOUT_MS
  while (Date.now() < deadline) {
    const row = (await db.select({ status: agentCommands.status, result: agentCommands.result }).from(agentCommands).where(eq(agentCommands.id, command.id)).limit(1))[0]
    if (!row) break
    if (row.status === 'completed') {
      return new Response(JSON.stringify(row.result ?? {}), { status: 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })
    }
    if (row.status === 'failed') {
      const result = row.result && typeof row.result === 'object' ? row.result as Record<string, unknown> : {}
      return new Response(JSON.stringify({ error: String(result.error ?? 'Agent polling köprüsü işlemi başarısız') }), { status: 502, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })
    }
    await new Promise(resolve => setTimeout(resolve, 300))
  }

  return new Response(JSON.stringify({ error: 'Agent polling köprüsü zaman aşımına uğradı.' }), { status: 504, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })
}

export async function nodeFetch(nodeId: string, path: string, init: RequestInit = {}) {
  let config: NodeConfig | null = null
  let directError: unknown = null
  try {
    config = getNodeConfig(nodeId)
  } catch (error) {
    directError = error
  }

  if (config && !placeholderAgentUrl(config.baseUrl)) {
    const headers = new Headers(init.headers)
    headers.set('authorization', `Bearer ${config.token}`)
    headers.set('x-node-id', nodeId)
    headers.set('accept', 'application/json')
    const endpoint = `${config.baseUrl}${path.startsWith('/') ? path : `/${path}`}`
    try {
      const response = await fetch(endpoint, { ...init, headers, cache: 'no-store', signal: init.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
      if (!response.ok) console.warn(`[node-bridge] ${new URL(config.baseUrl).hostname} ${response.status} ${path}`)
      return response
    } catch (error) {
      directError = error
      console.warn(`[node-bridge] direct agent unavailable; polling bridge fallback: ${path}`)
    }
  }

  try {
    return await commandBridgeFetch(nodeId, path, init)
  } catch (bridgeError) {
    if (directError instanceof Error) throw new Error(`${directError.message}; polling bridge: ${bridgeError instanceof Error ? bridgeError.message : 'başarısız'}`)
    throw bridgeError
  }
}

export function nodePublicHost(nodeId: string): string | null {
  const hosts = parseMap('NODE_PUBLIC_HOSTS')
  const explicit = hosts[nodeId] ?? process.env.NODE_PUBLIC_HOST ?? process.env.NODE_PUBLIC_IP ?? process.env.HOSTING_PUBLIC_IP ?? process.env.PUBLIC_IP ?? ''
  const configured = parseMap('NODE_AGENT_URLS')[nodeId] ?? process.env.NODE_AGENT_BASE_URL ?? process.env.NODE_UPLOAD_URL ?? process.env.NODE_DOWNLOAD_URL ?? ''
  const value = explicit.trim() || configured.trim()
  if (!value) return null
  try { return new URL(value.includes('://') ? value : `http://${value}`).hostname } catch { return null }
}

export function nodeDiagnosticMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Node bağlantısı kurulamadı'
}
