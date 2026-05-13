const STORAGE_KEY = 'pl_participant_id'

function newParticipantId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `pl-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/** Один id на вкладку браузера: первый визит и заявка совпадают по id в админке. */
export function getOrCreateParticipantId() {
  if (typeof window === 'undefined' || !window.sessionStorage) return newParticipantId()
  try {
    let id = window.sessionStorage.getItem(STORAGE_KEY)
    if (!id || !String(id).trim()) {
      id = newParticipantId()
      window.sessionStorage.setItem(STORAGE_KEY, id)
    }
    return id
  } catch {
    return newParticipantId()
  }
}
