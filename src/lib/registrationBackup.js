/** Локальная копия успешной заявки (переживает сброс БД на сервере). */
const STORAGE_KEY = 'pl_registration_completed_v1'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

/**
 * @param {Record<string, unknown>} record — тело POST /api/registrations
 */
export function saveRegistrationBackup(record) {
  if (!canUseStorage()) return
  const id = String(record.id || '').trim()
  if (!id) return
  const payload = {
    v: 1,
    id,
    fullName: String(record.fullName || '').trim(),
    email: String(record.email || '').trim(),
    flow: String(record.flow || 'full_registration'),
    mainPrizeOptIn: Boolean(record.mainPrizeOptIn),
    quizCategory: record.quizCategory ?? null,
    quizCategoryLabel: record.quizCategoryLabel ?? null,
    victorina: record.victorina ?? null,
    raffleNumber: record.raffleNumber != null ? String(record.raffleNumber) : null,
    submittedAt: record.submittedAt || new Date().toISOString(),
    savedAt: new Date().toISOString(),
  }
  if (!payload.fullName || !payload.email) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    /* quota / private mode */
  }
}

/**
 * @param {string} participantId
 * @returns {Record<string, unknown> | null}
 */
export function readRegistrationBackup(participantId) {
  if (!canUseStorage()) return null
  const expected = String(participantId || '').trim()
  if (!expected) return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || data.v !== 1 || String(data.id || '').trim() !== expected) return null
    if (!String(data.fullName || '').trim() || !String(data.email || '').trim()) return null
    return data
  } catch {
    return null
  }
}

/** Сохранить копию из ответа API, если в браузере её нет (БД — источник правды). */
export function ensureRegistrationBackupFromServer(participantId, registration) {
  if (!registration || typeof registration !== 'object') return
  const id = String(participantId || '').trim()
  if (!id || String(registration.id || '').trim() !== id) return
  if (readRegistrationBackup(id)) return
  saveRegistrationBackup(registration)
}

export function clearRegistrationBackup() {
  if (!canUseStorage()) return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
