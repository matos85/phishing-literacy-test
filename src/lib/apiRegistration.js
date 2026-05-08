/**
 * Отправка заявки на бэкенд (тот же origin в Docker; в dev — прокси Vite /api → :3000).
 */
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
    throw new Error(msg)
  }
  return data
}
