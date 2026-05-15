/** Браузер помнит, что уведомление MAX/файл для этого UUID уже было (переживает сброс БД). */
const STORAGE_KEY = 'pl_max_notify_sent_v1'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function readMaxNotifyClientMark(participantId) {
  if (!canUseStorage()) return false
  const expected = String(participantId || '').trim()
  if (!expected) return false
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const data = JSON.parse(raw)
    return Boolean(data && data.v === 1 && String(data.id || '').trim() === expected)
  } catch {
    return false
  }
}

export function saveMaxNotifyClientMark(participantId) {
  if (!canUseStorage()) return
  const id = String(participantId || '').trim()
  if (!id) return
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ v: 1, id, savedAt: new Date().toISOString() }),
    )
  } catch {
    /* ignore */
  }
}

/** Если в БД уже есть заявка — считаем, что уведомление не нужно повторять. */
export function ensureMaxNotifyClientMark(participantId) {
  if (readMaxNotifyClientMark(participantId)) return
  saveMaxNotifyClientMark(participantId)
}
