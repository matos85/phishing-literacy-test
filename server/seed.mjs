import { getPool } from './db.mjs'
import { migrate } from './migrate.mjs'
import { hashPassword } from './crypto-password.mjs'

const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'pl_admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Ph1shing-Literacy#2026'

export async function seed() {
  await migrate()
  const pool = getPool()

  const [admins] = await pool.execute('SELECT COUNT(*) AS c FROM admins')
  if (admins[0].c === 0) {
    const hash = hashPassword(ADMIN_PASSWORD)
    await pool.execute('INSERT INTO admins (login, password_hash) VALUES (?, ?)', [ADMIN_LOGIN, hash])
    console.log(`[seed] admin created: ${ADMIN_LOGIN}`)
  } else {
    console.log('[seed] admin already exists, skip')
  }
}

if (process.argv[1]?.endsWith('seed.mjs')) {
  seed()
    .then(async () => {
      await getPool().end()
      process.exit(0)
    })
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}
