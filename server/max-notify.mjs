/**
 * Уведомление в MAX (lk.dtel.ru): префикс, UUID и IP.
 * Повторно не шлём: registrations, max_notify_sent (БД), repeatVisit, метка в браузере.
 *
 * По умолчанию — HTTP в MAX. Отладка без MAX: MAX_NOTIFY_TO_FILE=1 (пишет NDJSON в data/).
 */

import { appendFile, mkdir } from 'fs/promises'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const MAX_MESSAGE_PREFIX = 'phishing check'

const MAX_SEND_URL = process.env.MAX_SEND_URL || 'https://lk.dtel.ru/max/send'
const MAX_TOKEN = String(process.env.MAX_TOKEN || '').trim()
const MAX_GROUP_RAW = String(process.env.MAX_GROUP || '').trim()
const MAX_NOTIFY_TO_FILE = /^(1|true|yes)$/i.test(String(process.env.MAX_NOTIFY_TO_FILE || ''))
const MAX_NOTIFY_FILE = resolve(
  process.env.MAX_NOTIFY_FILE || `${__dirname}/../data/max-notify.ndjson`,
)

let warnedMissingMaxConfig = false
let warnedFilePath = false

const notifiedParticipantIds = new Set()
const MAX_NOTIFIED_IDS = 8000

function isPlausibleIp(s) {
  if (!s || typeof s !== 'string') return false
  const t = s.trim()
  if (!t || t.length > 128) return false
  if (/не определён/i.test(t)) return false
  if (/^[\d.]+$/.test(t) && t.includes('.')) return true
  if (t.includes(':')) return true
  return false
}

export function isMaxNotifyExcludedPath(path) {
  const raw = String(path || '/').split('?')[0].trim() || '/'
  const n = raw.replace(/\/+$/, '') || '/'
  return n === '/admin' || n.startsWith('/admin/')
}

function parseGroup() {
  if (!MAX_GROUP_RAW) return null
  return MAX_GROUP_RAW
}

/** Режим доставки включён: MAX по HTTP или запись в файл (отладка). */
function canDeliverNotify() {
  if (MAX_NOTIFY_TO_FILE) return true
  return Boolean(MAX_TOKEN && MAX_GROUP_RAW)
}

function warnMissingMaxConfigOnce() {
  if (warnedMissingMaxConfig) return
  warnedMissingMaxConfig = true
  console.warn(
    '[max-notify] MAX_TOKEN или MAX_GROUP не заданы — HTTP в MAX отключён. Задайте их в admin-credentials.env или MAX_NOTIFY_TO_FILE=1 для отладки в файл.',
  )
}

function rememberInProcess(participantId) {
  notifiedParticipantIds.add(participantId)
  while (notifiedParticipantIds.size > MAX_NOTIFIED_IDS) {
    const first = notifiedParticipantIds.values().next().value
    notifiedParticipantIds.delete(first)
  }
}

async function hasRegistration(participantId, pool) {
  if (!pool) return false
  try {
    const [rows] = await pool.execute('SELECT id FROM registrations WHERE id = ? LIMIT 1', [participantId])
    return Array.isArray(rows) && rows.length > 0
  } catch (e) {
    console.error('[max-notify] registrations:', e?.message || e)
    return false
  }
}

async function hasMaxNotifySlotInDb(participantId, pool) {
  if (!pool) return false
  try {
    const [rows] = await pool.execute(
      'SELECT participant_id FROM max_notify_sent WHERE participant_id = ? LIMIT 1',
      [participantId],
    )
    return Array.isArray(rows) && rows.length > 0
  } catch (e) {
    console.error('[max-notify] max_notify_sent check:', e?.message || e)
    return false
  }
}

async function isNotifyBlocked(participantId, pool) {
  if (await hasRegistration(participantId, pool)) return true
  if (await hasMaxNotifySlotInDb(participantId, pool)) {
    rememberInProcess(participantId)
    return true
  }
  return false
}

async function tryReserveMaxNotifySlot(participantId, pool) {
  if (!pool) return !notifiedParticipantIds.has(participantId)
  if (await hasRegistration(participantId, pool)) return false
  try {
    const [result] = await pool.execute(
      'INSERT IGNORE INTO max_notify_sent (participant_id, notified_at) VALUES (?, NOW(3))',
      [participantId],
    )
    return Number(result?.affectedRows) > 0
  } catch (e) {
    console.error('[max-notify] max_notify_sent:', e?.message || e)
    return false
  }
}

function buildMaxPayload(participantId, c, r) {
  const ipPrimary = (isPlausibleIp(c) ? c : isPlausibleIp(r) ? r : '').trim()
  let message = `${MAX_MESSAGE_PREFIX}\n\nUUID: ${participantId}\nIP (клиент / ipify): ${ipPrimary}`
  if (isPlausibleIp(c) && isPlausibleIp(r) && c !== r) {
    message += `\nIP (запрос к серверу): ${r}`
  }
  return { group: parseGroup(), message }
}

async function appendMaxNotifyRecord(participantId, c, r) {
  const body = buildMaxPayload(participantId, c, r)
  const record = {
    at: new Date().toISOString(),
    participantId,
    clientIp: c || null,
    requestIp: r || null,
    sendUrl: MAX_SEND_URL,
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body,
  }
  await mkdir(dirname(MAX_NOTIFY_FILE), { recursive: true })
  await appendFile(MAX_NOTIFY_FILE, `${JSON.stringify(record)}\n`, 'utf8')
  if (!warnedFilePath) {
    warnedFilePath = true
    console.log('[max-notify] отладка: запись в файл', MAX_NOTIFY_FILE)
  }
}

async function sendMaxHttp(participantId, c, r) {
  const { message } = buildMaxPayload(participantId, c, r)
  const res = await fetch(MAX_SEND_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${MAX_TOKEN}`,
    },
    body: JSON.stringify({ group: parseGroup(), message }),
    signal: AbortSignal.timeout(12_000),
  })
  if (!res.ok) {
    console.error('[max-notify] HTTP', res.status, res.statusText, 'participantId=', participantId)
    return false
  }
  return true
}

/** @returns {Promise<boolean>} true — доставлено (MAX или файл) */
async function deliverMaxNotify(participantId, c, r) {
  if (MAX_NOTIFY_TO_FILE) {
    await appendMaxNotifyRecord(participantId, c, r)
    return true
  }
  return sendMaxHttp(participantId, c, r)
}

/**
 * @param {{ participantId: string, clientIp: string | null | undefined, requestIp: string | null | undefined }} p
 * @param {import('mysql2/promise').Pool} [pool]
 * @param {{ clientAlreadyNotified?: boolean, repeatVisit?: boolean }} [opts]
 * @returns {Promise<'written'|'synced'|'skipped'>}
 */
export async function notifyMaxVisitWithIp(
  p,
  pool,
  { clientAlreadyNotified = false, repeatVisit = false } = {},
) {
  const { participantId, clientIp, requestIp } = p
  if (!participantId) return 'skipped'

  const c = clientIp && String(clientIp).trim()
  const r = requestIp && String(requestIp).trim()

  if (clientAlreadyNotified) {
    if (await hasMaxNotifySlotInDb(participantId, pool)) {
      rememberInProcess(participantId)
      return 'skipped'
    }
    rememberInProcess(participantId)
    await markMaxNotifySentForRegistration(participantId, pool)
    return 'synced'
  }

  if (!isPlausibleIp(c) && !isPlausibleIp(r)) return 'skipped'
  if (await isNotifyBlocked(participantId, pool)) return 'skipped'

  if (repeatVisit && !(await hasMaxNotifySlotInDb(participantId, pool))) {
    rememberInProcess(participantId)
    await markMaxNotifySentForRegistration(participantId, pool)
    return 'synced'
  }

  if (!canDeliverNotify()) {
    warnMissingMaxConfigOnce()
    return 'skipped'
  }

  const reserved = await tryReserveMaxNotifySlot(participantId, pool)
  if (!reserved) return 'skipped'

  rememberInProcess(participantId)

  try {
    const ok = await deliverMaxNotify(participantId, c, r)
    return ok ? 'written' : 'skipped'
  } catch (e) {
    console.error('[max-notify]', e?.message || e)
    return 'skipped'
  }
}

export async function markMaxNotifySentForRegistration(participantId, pool) {
  if (!participantId) return
  rememberInProcess(participantId)
  if (!pool) return
  try {
    await pool.execute(
      'INSERT IGNORE INTO max_notify_sent (participant_id, notified_at) VALUES (?, NOW(3))',
      [participantId],
    )
  } catch (e) {
    console.error('[max-notify] mark registration:', e?.message || e)
  }
}
