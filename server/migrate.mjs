import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPool } from './db.mjs'

const statements = [
  `CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(64) NOT NULL UNIQUE,
    password_hash VARCHAR(512) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS registrations (
    id VARCHAR(36) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    raffle_number VARCHAR(32) NULL,
    main_prize_opt_in TINYINT(1) NOT NULL DEFAULT 0,
    flow VARCHAR(64) NOT NULL,
    quiz_category VARCHAR(32) NULL,
    quiz_category_label VARCHAR(255) NULL,
    victorina JSON NULL,
    telemetry JSON NOT NULL,
    submitted_at DATETIME(3) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_reg_submitted (submitted_at),
    INDEX idx_reg_email (email(64))
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
]

export async function migrate() {
  const pool = getPool()
  for (const sql of statements) {
    await pool.execute(sql)
  }
  console.log('[migrate] ok')
}

const isMain = path.resolve(process.argv[1] || '') === path.resolve(fileURLToPath(import.meta.url))
if (isMain) {
  migrate()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}
