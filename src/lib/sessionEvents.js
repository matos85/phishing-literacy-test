import { getParticipantIdForSiteContext } from './participantId'

/** Строго возрастающие метки времени (мс), чтобы события в одном действии не сливались в одну секунду в логе. */
let __lastOccurredMs = 0

export function nextClientOccurredIso() {
  let t = Date.now()
  if (t <= __lastOccurredMs) t = __lastOccurredMs + 1
  __lastOccurredMs = t
  return new Date(t).toISOString()
}

/** Удалить все session_events для участника (перед новым «первым открытием» воронки). */
export async function clearSessionEventsForParticipant(participantId) {
  if (typeof window === 'undefined') return
  const id = String(participantId || '').trim()
  if (!id) return
  try {
    await fetch('/api/session-events/clear-for-participant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: id }),
    })
  } catch {
    /* ignore */
  }
}

/**
 * Журнал шагов (публичный POST → админка читает GET).
 * @param {{ kind: string, path?: string | null, stepIndex?: number | null, label?: string | null, meta?: object | null, occurredAt?: string }} fields
 */
export async function logSessionEvent(fields) {
  if (typeof window === 'undefined') return
  const participantId = getParticipantIdForSiteContext()
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
