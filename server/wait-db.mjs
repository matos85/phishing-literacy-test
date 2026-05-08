import { getPool } from './db.mjs'

const MAX_ATTEMPTS = 60
const DELAY_MS = 1000

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function waitForDb() {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      const pool = getPool()
      const conn = await pool.getConnection()
      await conn.ping()
      conn.release()
      console.log('[wait-db] connected')
      return
    } catch (e) {
      console.log(`[wait-db] attempt ${i + 1}/${MAX_ATTEMPTS}… ${e.code || e.message}`)
      await sleep(DELAY_MS)
    }
  }
  throw new Error('MySQL not reachable')
}

if (process.argv[1]?.endsWith('wait-db.mjs')) {
  waitForDb()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}
