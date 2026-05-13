export async function authLogin(login, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, password }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || res.statusText)
  return data
}

export async function authLogout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
}

export async function authMe() {
  const res = await fetch('/api/auth/me', { credentials: 'include' })
  if (!res.ok) return { ok: false }
  return res.json()
}

export async function fetchRegistrations() {
  const res = await fetch('/api/registrations', { credentials: 'include' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || res.statusText)
  return data.data || []
}

export async function clearRegistrations() {
  const res = await fetch('/api/registrations', { method: 'DELETE', credentials: 'include' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || res.statusText)
  return data
}

export async function fetchSiteVisits() {
  const res = await fetch('/api/visits', { credentials: 'include' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || res.statusText)
  return data.data || []
}

export async function clearSiteVisits() {
  const res = await fetch('/api/visits', { method: 'DELETE', credentials: 'include' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || res.statusText)
  return data
}
