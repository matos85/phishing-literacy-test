const COOKIE_NAME = 'pl_participant_id'
/** Отдельный id для визитов и событий на `/admin` — не смешивается с воронкой регистрации. */
const ADMIN_COOKIE_NAME = 'pl_admin_participant_id'
/** Совпадает с VARCHAR(36) в `registrations.id` и `site_visits.id`. */
const PARTICIPANT_ID_MAX_LEN = 36
/** ~20 лет: постоянная метка в этом браузере (пока пользователь не очистит cookie). */
const COOKIE_MAX_AGE_SEC = 20 * 365 * 24 * 60 * 60
const LEGACY_STORAGE_KEY = 'pl_participant_id'

function newParticipantId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  const bytes = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes)
  else for (let i = 0; i < 16; i++) bytes[i] = (Math.random() * 256) | 0
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

function readCookie(name) {
  if (typeof document === 'undefined') return ''
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`))
  return m ? decodeURIComponent(m[1].trim()) : ''
}

function writeParticipantCookie(value) {
  if (typeof document === 'undefined') return
  let cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; Max-Age=${COOKIE_MAX_AGE_SEC}; Path=/; SameSite=Lax`
  if (typeof location !== 'undefined' && location.protocol === 'https:') cookie += '; Secure'
  document.cookie = cookie
}

function writeAdminParticipantCookie(value) {
  if (typeof document === 'undefined') return
  let cookie = `${ADMIN_COOKIE_NAME}=${encodeURIComponent(value)}; Max-Age=${COOKIE_MAX_AGE_SEC}; Path=/; SameSite=Lax`
  if (typeof location !== 'undefined' && location.protocol === 'https:') cookie += '; Secure'
  document.cookie = cookie
}

/**
 * Один id на браузер (cookie с длительным сроком): визит, заявка и события совпадают в админке.
 * Раньше id хранился в sessionStorage — один раз переносим в cookie.
 */
export function getOrCreateParticipantId() {
  if (typeof window === 'undefined') return newParticipantId()
  try {
    let id = readCookie(COOKIE_NAME)
    if (id.length > PARTICIPANT_ID_MAX_LEN) id = ''
    if (!id) {
      try {
        const legacy = window.sessionStorage?.getItem(LEGACY_STORAGE_KEY)
        if (legacy && String(legacy).trim()) {
          const leg = String(legacy).trim()
          id = leg.length <= PARTICIPANT_ID_MAX_LEN ? leg : ''
          window.sessionStorage.removeItem(LEGACY_STORAGE_KEY)
        }
      } catch {
        /* ignore */
      }
    }
    if (!id) id = newParticipantId()
    if (readCookie(COOKIE_NAME) !== id) writeParticipantCookie(id)
    return id
  } catch {
    return newParticipantId()
  }
}

/**
 * Id для журналирования на страницах админки: маршруты и визиты не попадают в сессию участника регистрации.
 */
export function getOrCreateAdminParticipantId() {
  if (typeof window === 'undefined') return newParticipantId()
  try {
    let id = readCookie(ADMIN_COOKIE_NAME)
    if (id.length > PARTICIPANT_ID_MAX_LEN) id = ''
    if (!id) id = newParticipantId()
    if (readCookie(ADMIN_COOKIE_NAME) !== id) writeAdminParticipantCookie(id)
    return id
  } catch {
    return newParticipantId()
  }
}

/** Визиты и session-events: на `/admin` — отдельный id; на остальных маршрутах — участник регистрации. */
export function getParticipantIdForSiteContext() {
  if (typeof window === 'undefined') return getOrCreateParticipantId()
  const path = (window.location.pathname || '/').split('?')[0] || '/'
  const n = path.replace(/\/+$/, '') || '/'
  if (n === '/admin' || n.startsWith('/admin/')) return getOrCreateAdminParticipantId()
  return getOrCreateParticipantId()
}
