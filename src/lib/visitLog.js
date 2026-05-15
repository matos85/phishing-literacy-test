import { buildTelemetry } from './clientMeta'
import { readMaxNotifyClientMark, saveMaxNotifyClientMark } from './maxNotifyClientMark'
import { getParticipantIdForSiteContext } from './participantId'

/** Визит по id сессии; при повторной загрузке строка обновляется на сервере (тот же id). */
export async function logSiteVisit() {
  if (typeof window === 'undefined') return
  const id = getParticipantIdForSiteContext()
  const path = `${window.location.pathname}${window.location.search || ''}`
  try {
    const telemetry = await buildTelemetry()
    const res = await fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        path,
        telemetry,
        openedAt: new Date().toISOString(),
        clientMaxNotified: readMaxNotifyClientMark(id),
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (data.maxNotifyRecorded || data.maxNotifySynced || readMaxNotifyClientMark(id)) {
      saveMaxNotifyClientMark(id)
    }
  } catch {
    /* ignore */
  }
}
