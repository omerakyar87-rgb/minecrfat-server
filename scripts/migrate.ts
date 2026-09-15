import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { pool } from '../lib/db/postgres'

const migrationsDir = path.join(process.cwd(), 'migrations')

async function main() {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`)
  const applied = new Set((await pool.query('SELECT version FROM schema_migrations')).rows.map((row) => String(row.version)))
  const files = (await readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort()
  for (const file of files) {
    const version = file.replace(/\.sql$/, '')
    if (applied.has(version)) continue
    const sql = await readFile(path.join(migrationsDir, file), 'utf8')
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      for (const statement of sql.split(/^-- statement:.*$/m).map((part) => part.trim()).filter(Boolean)) await client.query(statement)
      await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version])
      await client.query('COMMIT')
      console.log(`Applied ${version}`)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}

main().finally(() => pool.end())
