import { randomBytes } from 'node:crypto'

export const sessionCookieName = 'pl_sess'

const sessions = new Map()
const TTL_MS = 24 * 60 * 60 * 1000

export function createSession(login) {
  const token = randomBytes(32).toString('hex')
  sessions.set(token, { login, expires: Date.now() + TTL_MS })
  return token
}

export function getSession(token) {
  if (!token) return null
  const s = sessions.get(token)
  if (!s) return null
  if (Date.now() > s.expires) {
    sessions.delete(token)
    return null
  }
  return s
}

export function deleteSession(token) {
  if (token) sessions.delete(token)
}

export function parseCookies(header) {
  const out = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (!k) continue
    out[k] = decodeURIComponent(rest.join('=') || '')
  }
  return out
}

export function buildSetCookie(name, value, { maxAgeSec = 86400, httpOnly = true } = {}) {
  const parts = [`${name}=${value}`, `Path=/`, `Max-Age=${maxAgeSec}`, 'SameSite=Lax']
  if (httpOnly) parts.push('HttpOnly')
  return parts.join('; ')
}

export function buildClearCookie(name) {
  return `${name}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly`
}
