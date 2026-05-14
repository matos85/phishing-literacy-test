/**
 * Уведомление в MAX (lk.dtel.ru): только UUID и IP участника.
 * Токен и группа — из admin-credentials.env: MAX_TOKEN, MAX_GROUP.
 * Визиты со страницы /admin не отправляются (см. isMaxNotifyExcludedPath).
 */

const MAX_SEND_URL = process.env.MAX_SEND_URL || 'https://lk.dtel.ru/max/send'
const MAX_TOKEN = String(process.env.MAX_TOKEN || '').trim()
const MAX_GROUP_RAW = String(process.env.MAX_GROUP || '').trim()

let warnedMissingMaxConfig = false

/** Не слать повторно при каждом обновлении визита с тем же participant id (ограничение размера). */
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

/** В MAX не уходят визиты с админки (и вложенных путей /admin/…). */
export function isMaxNotifyExcludedPath(path) {
  const raw = String(path || '/').split('?')[0].trim() || '/'
  const n = raw.replace(/\/+$/, '') || '/'
  return n === '/admin' || n.startsWith('/admin/')
}

function parseGroup() {
  if (!MAX_GROUP_RAW) return null
  return MAX_GROUP_RAW
}

/**
 * @param {{ participantId: string, clientIp: string | null | undefined, requestIp: string | null | undefined }} p
 */
export function notifyMaxVisitWithIp(p) {
  if (!MAX_TOKEN || !MAX_GROUP_RAW) {
    if (!warnedMissingMaxConfig) {
      warnedMissingMaxConfig = true
      console.warn(
        '[max-notify] MAX_TOKEN или MAX_GROUP не заданы — уведомления в MAX отключены. Добавьте их в admin-credentials.env (тот же файл, что и ADMIN_*, для Docker: env_file).',
      )
    }
    return
  }
  const { participantId, clientIp, requestIp } = p
  if (!participantId) return
  const c = clientIp && String(clientIp).trim()
  const r = requestIp && String(requestIp).trim()
  const hasIp = isPlausibleIp(c) || isPlausibleIp(r)
  if (!hasIp) return
  if (notifiedParticipantIds.has(participantId)) return

  const ipLine = (isPlausibleIp(r) ? r : isPlausibleIp(c) ? c : '').trim()
  const message = `UUID: ${participantId}\nIP: ${ipLine}`

  const group = parseGroup()
  const body = JSON.stringify({ group, message })

  void fetch(MAX_SEND_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${MAX_TOKEN}`,
    },
    body,
    signal: AbortSignal.timeout(12_000),
  })
    .then((res) => {
      if (!res.ok) {
        console.error('[max-notify] HTTP', res.status, res.statusText, 'participantId=', participantId)
        return
      }
      notifiedParticipantIds.add(participantId)
      while (notifiedParticipantIds.size > MAX_NOTIFIED_IDS) {
        const first = notifiedParticipantIds.values().next().value
        notifiedParticipantIds.delete(first)
      }
    })
    .catch((e) => {
      console.error('[max-notify]', e?.message || e)
    })
}
