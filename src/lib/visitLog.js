import { buildTelemetry } from './clientMeta'
import { getOrCreateParticipantId } from './participantId'

/** Визит по id сессии; при повторной загрузке строка обновляется на сервере (тот же id). */
export async function logSiteVisit() {
  if (typeof window === 'undefined') return
  const id = getOrCreateParticipantId()
  const path = `${window.location.pathname}${window.location.search || ''}`
  try {
    const telemetry = await buildTelemetry()
    await fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        path,
        telemetry,
        openedAt: new Date().toISOString(),
      }),
    })
  } catch {
    /* ignore */
  }
}
