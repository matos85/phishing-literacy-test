/**
 * Метаданные браузера/окружения (без сервера).
 * IP — через внешний API (для учебного стенда; в проде лучше фиксировать на бэкенде).
 */
export function getClientMeta() {
  return {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    language: typeof navigator !== 'undefined' ? navigator.language : '',
    languages:
      typeof navigator !== 'undefined' && navigator.languages ? [...navigator.languages] : undefined,
    platform: typeof navigator !== 'undefined' ? navigator.platform : '',
    screen:
      typeof screen !== 'undefined' ? `${screen.width}×${screen.height} (avail ${screen.availWidth}×${screen.availHeight})` : '',
    viewport:
      typeof window !== 'undefined' ? `${window.innerWidth}×${window.innerHeight}` : '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
}

export async function getClientIp() {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 6000)
    const res = await fetch('https://api.ipify.org?format=json', { signal: ctrl.signal })
    clearTimeout(t)
    if (!res.ok) return null
    const data = await res.json()
    return typeof data?.ip === 'string' ? data.ip : null
  } catch {
    return null
  }
}

export async function buildTelemetry() {
  const [ip, meta] = await Promise.all([getClientIp(), Promise.resolve(getClientMeta())])
  return {
    ip: ip || 'не определён (сеть / блокировка API)',
    ...meta,
  }
}
