import { Pool, type PoolConfig } from 'pg'

const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? process.env.NEON_DATABASE_URL

function normalizeConnectionString(value: string | undefined) {
  if (!value) return undefined

  try {
    const url = new URL(value)
    const sslMode = url.searchParams.get('sslmode')?.toLowerCase()

    if (sslMode === 'require') {
      url.searchParams.set('uselibpqcompat', 'true')
    }

    return url.toString()
  } catch {
    return value
  }
}

export function createPostgresPool(overrides: PoolConfig = {}) {
  const connectionString = normalizeConnectionString(databaseUrl)

  return new Pool({
    ...(connectionString ? { connectionString } : {}),
    connectionTimeoutMillis: 5000,
    max: 5,
    ...overrides,
  })
}

export const pool = createPostgresPool()
