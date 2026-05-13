/**
 * IP клиента по заголовкам прокси или сокету (для журнала посещений на бэкенде).
 */
export function clientIpFromReq(req) {
  const xf = req.headers['x-forwarded-for']
  if (xf) {
    const first = String(xf).split(',')[0].trim()
    if (first) return first
  }
  const xr = req.headers['x-real-ip']
  if (xr && String(xr).trim()) return String(xr).trim()
  const ra = req.socket?.remoteAddress
  if (ra) return String(ra).replace(/^::ffff:/, '')
  return null
}
