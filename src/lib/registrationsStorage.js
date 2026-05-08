const KEY = 'phishing-literacy-registrations'

export function loadRegistrations() {
  try {
    const raw = localStorage.getItem(KEY) || sessionStorage.getItem(KEY) || '[]'
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr
  } catch {
    return []
  }
}

/** Однократно подтянуть данные из sessionStorage, если localStorage пуст. */
export function migrateSessionToLocalOnce() {
  try {
    if (localStorage.getItem(KEY)) return
    const s = sessionStorage.getItem(KEY)
    if (s) {
      localStorage.setItem(KEY, s)
    }
  } catch {
    /* ignore */
  }
}

export function saveRegistrations(list) {
  const payload = JSON.stringify(list)
  localStorage.setItem(KEY, payload)
  try {
    sessionStorage.setItem(KEY, payload)
  } catch {
    /* ignore */
  }
}

export function appendRegistration(record) {
  migrateSessionToLocalOnce()
  const prev = loadRegistrations()
  prev.push(record)
  saveRegistrations(prev)
}
