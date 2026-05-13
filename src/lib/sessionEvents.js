import { getOrCreateParticipantId } from './participantId'

/** Строго возрастающие метки времени (мс), чтобы события в одном действии не сливались в одну секунду в логе. */
let __lastOccurredMs = 0

export function nextClientOccurredIso() {
  let t = Date.now()
  if (t <= __lastOccurredMs) t = __lastOccurredMs + 1
  __lastOccurredMs = t
  return new Date(t).toISOString()
}

/**
 * Журнал шагов и переходов (публичный POST → админка читает GET).
 * @param {{ kind: string, path?: string | null, stepIndex?: number | null, label?: string | null, meta?: object | null, occurredAt?: string }} fields
 */
export async function logSessionEvent(fields) {
  if (typeof window === 'undefined') return
  const participantId = getOrCreateParticipantId()
  const { kind, path, stepIndex, label, meta, occurredAt } = fields
  try {
    await fetch('/api/session-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantId,
        occurredAt: occurredAt ?? nextClientOccurredIso(),
        kind,
        path: path ?? undefined,
        stepIndex: stepIndex ?? undefined,
        label: label ?? undefined,
        meta: meta ?? undefined,
      }),
    })
  } catch {
    /* ignore */
  }
}

/** Смена маршрута SPA (полный путь с query). */
export function logRouteEvent(fullPath) {
  const path = String(fullPath || '/').slice(0, 768)
  return logSessionEvent({
    kind: 'route',
    path,
    label: 'Страница',
  })
}

/** Переход между шагами + введённые данные (без дублирования from/to в meta — это в label). */
export function logRegisterTransition(fromStep, toStep, meta, label) {
  const path = `${window.location.pathname}${window.location.search || ''}`.slice(0, 768)
  const extra = meta && typeof meta === 'object' ? meta : {}
  const m = trimMetaStrings(extra)
  return logSessionEvent({
    kind: 'register_transition',
    stepIndex: fromStep,
    label: label || `Шаг ${fromStep + 1} → ${toStep == null ? 'завершение' : toStep + 1}`,
    path,
    meta: Object.keys(m).length ? m : undefined,
  })
}

export function logRegisterQuizPreparing() {
  const path = `${window.location.pathname}${window.location.search || ''}`.slice(0, 768)
  return logSessionEvent({
    kind: 'register_quiz_prepare',
    label: 'Подготовка вопроса викторины',
    path,
  })
}

export function logRegisterQuizReady() {
  const path = `${window.location.pathname}${window.location.search || ''}`.slice(0, 768)
  return logSessionEvent({
    kind: 'register_quiz_ready',
    label: 'Вопрос викторины показан',
    path,
  })
}

function trimMetaStrings(obj, maxLen = 480) {
  if (!obj || typeof obj !== 'object') return {}
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      out[k] = v.length > maxLen ? `${v.slice(0, maxLen)}…` : v
    } else if (v != null && (typeof v === 'number' || typeof v === 'boolean')) {
      out[k] = v
    } else if (v != null) {
      try {
        const s = JSON.stringify(v)
        out[k] = s.length > maxLen ? `${s.slice(0, maxLen)}…` : s
      } catch {
        out[k] = String(v).slice(0, maxLen)
      }
    }
  }
  return out
}

