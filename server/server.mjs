import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPool } from './db.mjs'
import { verifyPassword } from './crypto-password.mjs'
import { clientIpFromReq } from './client-ip.mjs'
import {
  sessionCookieName,
  createSession,
  getSession,
  deleteSession,
  parseCookies,
  buildSetCookie,
  buildClearCookie,
} from './session.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, '..', 'dist')
const PORT = Number(process.env.PORT || 3000)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8',
}

function json(res, status, obj) {
  const body = JSON.stringify(obj)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

async function readJsonBody(req) {
  const chunks = []
  for await (const c of req) chunks.push(c)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function rowToApi(r) {
  let victorina = r.victorina
  if (victorina == null) victorina = null
  else if (typeof victorina === 'string') victorina = JSON.parse(victorina)
  let telemetry = r.telemetry
  if (typeof telemetry === 'string') telemetry = JSON.parse(telemetry)
  let submittedAt = r.submitted_at
  if (submittedAt instanceof Date) submittedAt = submittedAt.toISOString()
  return {
    id: r.id,
    fullName: r.full_name,
    email: r.email,
    raffleNumber: r.raffle_number,
    mainPrizeOptIn: Boolean(r.main_prize_opt_in),
    flow: r.flow,
    quizCategory: r.quiz_category,
    quizCategoryLabel: r.quiz_category_label,
    victorina,
    telemetry,
    submittedAt,
  }
}

function visitRowToApi(r) {
  let telemetry = r.telemetry
  if (telemetry == null) telemetry = {}
  else if (typeof telemetry === 'string') telemetry = JSON.parse(telemetry)
  let openedAt = r.opened_at
  if (openedAt instanceof Date) openedAt = openedAt.toISOString()
  return {
    id: r.id,
    path: r.path,
    telemetry,
    openedAt,
  }
}

function sessionEventRowToApi(r) {
  let meta = r.meta
  if (meta == null) meta = null
  else if (typeof meta === 'string') meta = JSON.parse(meta)
  let occurredAt = r.occurred_at
  if (occurredAt instanceof Date) occurredAt = occurredAt.toISOString()
  return {
    id: Number(r.id),
    participantId: r.participant_id,
    occurredAt,
    kind: r.kind,
    path: r.path,
    stepIndex: r.step_index == null ? null : Number(r.step_index),
    label: r.label,
    meta,
  }
}

function getSessionToken(req) {
  const cookies = parseCookies(req.headers.cookie)
  return cookies[sessionCookieName] || null
}

function requireAuth(req) {
  const token = getSessionToken(req)
  const s = getSession(token)
  if (!s) return null
  return { token, login: s.login }
}

/** Порядковый номер участника: 1, 2, 3, … (по максимуму среди уже числовых значений в БД). */
async function allocateNextRaffleNumber(conn) {
  const [rows] = await conn.execute(
    `SELECT COALESCE(MAX(CAST(raffle_number AS UNSIGNED)), 0) AS m
     FROM registrations
     WHERE raffle_number REGEXP '^[0-9]+$'`,
  )
  const next = Number(rows[0].m) + 1
  return String(next)
}

async function handleApi(req, res, url) {
  const pathname = url.pathname

  if (pathname === '/api/health' && req.method === 'GET') {
    return json(res, 200, { ok: true })
  }

  if (pathname === '/api/auth/login' && req.method === 'POST') {
    const body = await readJsonBody(req)
    if (!body || typeof body.login !== 'string' || typeof body.password !== 'string') {
      return json(res, 400, { error: 'Нужны login и password' })
    }
    const pool = getPool()
    const [rows] = await pool.execute('SELECT login, password_hash FROM admins WHERE login = ? LIMIT 1', [
      body.login.trim(),
    ])
    if (!rows.length || !verifyPassword(body.password, rows[0].password_hash)) {
      return json(res, 401, { error: 'Неверный логин или пароль' })
    }
    const token = createSession(rows[0].login)
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Set-Cookie': buildSetCookie(sessionCookieName, token),
    })
    return res.end(JSON.stringify({ ok: true, login: rows[0].login }))
  }

  if (pathname === '/api/auth/logout' && req.method === 'POST') {
    const token = getSessionToken(req)
    deleteSession(token)
    res.writeHead(204, { 'Set-Cookie': buildClearCookie(sessionCookieName) })
    return res.end()
  }

  if (pathname === '/api/auth/me' && req.method === 'GET') {
    const auth = requireAuth(req)
    if (!auth) return json(res, 401, { ok: false })
    return json(res, 200, { ok: true, login: auth.login })
  }

  if (pathname === '/api/registrations' && req.method === 'GET') {
    const auth = requireAuth(req)
    if (!auth) return json(res, 401, { error: 'Требуется вход' })
    const pool = getPool()
    const [rows] = await pool.execute(
      'SELECT * FROM registrations ORDER BY submitted_at DESC',
    )
    return json(res, 200, { data: rows.map(rowToApi) })
  }

  if (pathname === '/api/registrations' && req.method === 'DELETE') {
    const auth = requireAuth(req)
    if (!auth) return json(res, 401, { error: 'Требуется вход' })
    const pool = getPool()
    await pool.execute('DELETE FROM registrations')
    return json(res, 200, { ok: true })
  }

  if (pathname === '/api/visits' && req.method === 'GET') {
    const auth = requireAuth(req)
    if (!auth) return json(res, 401, { error: 'Требуется вход' })
    const pool = getPool()
    const [rows] = await pool.execute('SELECT * FROM site_visits ORDER BY opened_at DESC')
    return json(res, 200, { data: rows.map(visitRowToApi) })
  }

  if (pathname === '/api/visits' && req.method === 'DELETE') {
    const auth = requireAuth(req)
    if (!auth) return json(res, 401, { error: 'Требуется вход' })
    const pool = getPool()
    await pool.execute('DELETE FROM site_visits')
    await pool.execute('DELETE FROM session_events')
    return json(res, 200, { ok: true })
  }

  if (pathname === '/api/visits' && req.method === 'POST') {
    const body = await readJsonBody(req)
    if (!body || typeof body !== 'object') return json(res, 400, { error: 'Неверное тело запроса' })
    const id = String(body.id || '').trim()
    if (!id) return json(res, 400, { error: 'Нужен id' })
    const pathStr = String(body.path || '/').trim().slice(0, 768) || '/'
    const telemetryClient = body.telemetry && typeof body.telemetry === 'object' ? body.telemetry : {}
    const reqIp = clientIpFromReq(req)
    const telemetryPayload = JSON.stringify({
      ...telemetryClient,
      ...(reqIp ? { requestIp: reqIp } : {}),
    })
    const openedAt = body.openedAt ? new Date(body.openedAt) : new Date()
    if (Number.isNaN(openedAt.getTime())) return json(res, 400, { error: 'Некорректная дата' })
    const pool = getPool()
    try {
      await pool.execute(
        `INSERT INTO site_visits (id, path, telemetry, opened_at) VALUES (?, ?, CAST(? AS JSON), ?)
         ON DUPLICATE KEY UPDATE
           path = VALUES(path),
           telemetry = VALUES(telemetry),
           opened_at = VALUES(opened_at)`,
        [id, pathStr, telemetryPayload, openedAt],
      )
      return json(res, 200, { ok: true, id })
    } catch (e) {
      console.error(e)
      return json(res, 500, { error: 'Ошибка сохранения' })
    }
  }

  if (pathname === '/api/session-events' && req.method === 'GET') {
    const auth = requireAuth(req)
    if (!auth) return json(res, 401, { error: 'Требуется вход' })
    const pool = getPool()
    const [rows] = await pool.execute(
      'SELECT * FROM session_events ORDER BY occurred_at DESC LIMIT 20000',
    )
    return json(res, 200, { data: rows.map(sessionEventRowToApi) })
  }

  if (pathname === '/api/session-events' && req.method === 'DELETE') {
    const auth = requireAuth(req)
    if (!auth) return json(res, 401, { error: 'Требуется вход' })
    const pool = getPool()
    await pool.execute('DELETE FROM session_events')
    return json(res, 200, { ok: true })
  }

  if (pathname === '/api/session-events' && req.method === 'POST') {
    const body = await readJsonBody(req)
    if (!body || typeof body !== 'object') return json(res, 400, { error: 'Неверное тело запроса' })
    const participantId = String(body.participantId || '').trim()
    if (!participantId || participantId.length > 64) {
      return json(res, 400, { error: 'Некорректный participantId' })
    }
    const kind = String(body.kind || '').trim().slice(0, 40)
    if (!kind) return json(res, 400, { error: 'Нужен kind' })
    const pathStr = body.path != null ? String(body.path).trim().slice(0, 768) : null
    const label = body.label != null ? String(body.label).trim().slice(0, 512) : null
    let stepIndex = body.stepIndex
    if (stepIndex != null && stepIndex !== '') {
      stepIndex = Number(stepIndex)
      if (!Number.isFinite(stepIndex) || stepIndex < -32768 || stepIndex > 32767) {
        return json(res, 400, { error: 'Некорректный stepIndex' })
      }
    } else {
      stepIndex = null
    }
    let metaJson = null
    if (body.meta != null && typeof body.meta === 'object') {
      metaJson = JSON.stringify(body.meta)
    }
    const occurredAt = body.occurredAt ? new Date(body.occurredAt) : new Date()
    if (Number.isNaN(occurredAt.getTime())) return json(res, 400, { error: 'Некорректная дата' })
    const pool = getPool()
    try {
      await pool.execute(
        `INSERT INTO session_events (participant_id, occurred_at, kind, path, step_index, label, meta)
         VALUES (?, ?, ?, ?, ?, ?, CAST(? AS JSON))`,
        [participantId, occurredAt, kind, pathStr || null, stepIndex, label || null, metaJson || 'null'],
      )
      return json(res, 201, { ok: true })
    } catch (e) {
      console.error(e)
      return json(res, 500, { error: 'Ошибка сохранения' })
    }
  }

  if (pathname === '/api/registrations' && req.method === 'POST') {
    const body = await readJsonBody(req)
    if (!body || typeof body !== 'object') return json(res, 400, { error: 'Неверное тело запроса' })
    const id = String(body.id || '').trim()
    const fullName = String(body.fullName || '').trim()
    const email = String(body.email || '').trim()
    if (!id || !fullName || !email) return json(res, 400, { error: 'id, fullName, email обязательны' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(res, 400, { error: 'Некорректный email' })
    const flow = String(body.flow || '')
    if (!['full_registration', 'declined_main_prize'].includes(flow)) {
      return json(res, 400, { error: 'Некорректный flow' })
    }
    const telemetryBase = body.telemetry && typeof body.telemetry === 'object' ? body.telemetry : { note: 'empty' }
    const reqIp = clientIpFromReq(req)
    const telemetry = { ...telemetryBase, ...(reqIp ? { requestIp: reqIp } : {}) }
    const victorina = body.victorina == null ? null : body.victorina
    const submittedAt = body.submittedAt ? new Date(body.submittedAt) : new Date()
    if (Number.isNaN(submittedAt.getTime())) return json(res, 400, { error: 'Некорректная дата' })

    const pool = getPool()
    const insertSql = `INSERT INTO registrations (
          id, full_name, email, raffle_number, main_prize_opt_in, flow,
          quiz_category, quiz_category_label, victorina, telemetry, submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON), ?)`

    const conn = await pool.getConnection()
    const lockName = 'pl_reg_raffle_seq'
    try {
      await conn.query('SELECT GET_LOCK(?, 20)', [lockName])
      const raffleNumber = await allocateNextRaffleNumber(conn)
      await conn.execute(insertSql, [
        id,
        fullName,
        email,
        raffleNumber,
        body.mainPrizeOptIn ? 1 : 0,
        flow,
        body.quizCategory || null,
        body.quizCategoryLabel || null,
        victorina == null ? null : JSON.stringify(victorina),
        JSON.stringify(telemetry),
        submittedAt,
      ])
      return json(res, 201, { ok: true, id, raffleNumber })
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        const msg = String(e.sqlMessage || '')
        if (msg.includes('PRIMARY') || msg.includes(`'PRIMARY'`)) {
          return json(res, 409, { error: 'Запись с таким id уже есть' })
        }
      }
      console.error(e)
      return json(res, 500, { error: 'Ошибка сохранения' })
    } finally {
      try {
        await conn.query('SELECT RELEASE_LOCK(?)', [lockName])
      } catch {
        /* ignore */
      }
      conn.release()
    }
  }

  return json(res, 404, { error: 'Not found' })
}

function serveStatic(req, res, url) {
  let filePath = path.join(distDir, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname))
  if (!filePath.startsWith(distDir)) {
    res.writeHead(403)
    return res.end()
  }
  fs.stat(filePath, (err, st) => {
    if (!err && st.isFile()) {
      const ext = path.extname(filePath)
      const type = MIME[ext] || 'application/octet-stream'
      res.writeHead(200, { 'Content-Type': type })
      fs.createReadStream(filePath).pipe(res)
      return
    }
    const fallback = path.join(distDir, 'index.html')
    fs.stat(fallback, (e2, st2) => {
      if (e2 || !st2.isFile()) {
        res.writeHead(404)
        return res.end('Not found')
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      fs.createReadStream(fallback).pipe(res)
    })
  })
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`)
    if (url.pathname.startsWith('/api')) {
      return handleApi(req, res, url)
    }
    if (req.method === 'GET') {
      return serveStatic(req, res, url)
    }
    res.writeHead(405)
    res.end()
  } catch (e) {
    console.error(e)
    json(res, 500, { error: 'Internal error' })
  }
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] http://0.0.0.0:${PORT}`)
})
