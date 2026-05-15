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
  `CREATE TABLE IF NOT EXISTS site_visits (
    id VARCHAR(36) PRIMARY KEY,
    path VARCHAR(768) NOT NULL DEFAULT '/',
    telemetry JSON NOT NULL,
    opened_at DATETIME(3) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_visits_opened (opened_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS session_events (
    id BIGINT NOT NULL AUTO_INCREMENT,
    participant_id VARCHAR(64) NOT NULL,
    occurred_at DATETIME(3) NOT NULL,
    kind VARCHAR(40) NOT NULL,
    path VARCHAR(768) NULL,
    step_index SMALLINT NULL,
    label VARCHAR(512) NULL,
    meta JSON NULL,
    created_at TIMESTAMP(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    KEY idx_se_participant_time (participant_id, occurred_at),
    KEY idx_se_occurred (occurred_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS max_notify_sent (
    participant_id VARCHAR(36) PRIMARY KEY,
    notified_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
]

async function ensureUniqueRaffleNumberIndex(pool) {
  try {
    await pool.execute('ALTER TABLE registrations ADD UNIQUE INDEX uk_raffle_number (raffle_number)')
  } catch (e) {
    if (e.code === 'ER_DUP_KEYNAME' || e.errno === 1061) return
    if (e.code === 'ER_DUP_ENTRY' || e.errno === 1062) {
      console.warn('[migrate] пропуск UNIQUE по raffle_number: в таблице есть повторяющиеся номера')
      return
    }
    throw e
  }
}

export async function migrate() {
  const pool = getPool()
  for (const sql of statements) {
    await pool.execute(sql)
  }
  await ensureUniqueRaffleNumberIndex(pool)
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
