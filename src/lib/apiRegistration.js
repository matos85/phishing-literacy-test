/**
 * Публичный запрос: есть ли заявка с данным id участника (совпадает с cookie `pl_participant_id`).
 */
export async function fetchRegistrationStatus(participantId) {
  const raw = String(participantId || '').trim()
  if (!raw) return { registered: false }
  const id = encodeURIComponent(raw)
  const ctrl = typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined
  const res = await fetch(`/api/registration-status?id=${id}`, ctrl ? { signal: ctrl } : {})
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { registered: false, error: data.error }
  return {
    registered: Boolean(data.registered),
    registration: data.registration && typeof data.registration === 'object' ? data.registration : null,
  }
}

export class RegistrationApiError extends Error {
  /** @param {string} message @param {number} status */
  constructor(message, status) {
    super(message)
    this.name = 'RegistrationApiError'
    this.status = status
  }
}

/**
 * Восстановить заявку в БД из локальной копии (после сброса БД, тот же cookie).
 * @param {Record<string, unknown>} backup
 */
export async function restoreRegistrationFromClient(backup) {
  const res = await fetch('/api/registrations/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(backup),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data.error || res.statusText || `HTTP ${res.status}`
    throw new RegistrationApiError(msg, res.status)
  }
  return data
}

export async function submitRegistration(record) {
  const res = await fetch('/api/registrations', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  })
  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { raw: text }
  }
  if (!res.ok) {
    const msg = data.error || data.raw || res.statusText || `HTTP ${res.status}`
    throw new RegistrationApiError(msg, res.status)
  }
  return data
}
