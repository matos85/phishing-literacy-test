/**
 * Журнал сценария регистрации: только явно заданные события (без общего лога маршрутов).
 * Путь и время события — в полях ответа API и в колонках админки, не дублируем в подписи.
 */
import { logSessionEvent, nextClientOccurredIso } from './sessionEvents'

/** Ключ sessionStorage: первое открытие формы в этой вкладке (не F5). */
export const SK_REG_FIRST_OPEN = 'pl_reg_first_open_logged'
/** После первого «Далее» (шаг > 0): не чистить session_events при F5 на форме. Сброс — в resetRegisterSessionMarkers. */
export const SK_REG_FUNNEL_ACTIVE = 'pl_reg_funnel_active'
/** После успешной отправки заявки — экран complete без доверия к ?returning= в URL. */
export const SK_REG_JUST_SUBMITTED = 'pl_reg_just_submitted'

export function markRegisterJustSubmitted() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(SK_REG_JUST_SUBMITTED, '1')
  } catch {
    /* ignore */
  }
}

/** @returns {boolean} true — только что отправили заявку в этой вкладке */
export function consumeRegisterJustSubmitted() {
  if (typeof window === 'undefined') return false
  try {
    const v = sessionStorage.getItem(SK_REG_JUST_SUBMITTED) === '1'
    sessionStorage.removeItem(SK_REG_JUST_SUBMITTED)
    return v
  } catch {
    return false
  }
}
const LABEL_MAX = 512

function pathNow() {
  return `${window.location.pathname}${window.location.search || ''}`.slice(0, 768)
}

function occurredNow() {
  return nextClientOccurredIso()
}

function truncateLabel(s) {
  if (s.length <= LABEL_MAX) return s
  return s.slice(0, LABEL_MAX - 1) + '…'
}

/** Краткое имя шага (без «из 4») — для подписей переходов вперёд и назад. */
function stepTitleShort(stepIndex) {
  const titles = [
    'шаг 1 — как к вам обращаться (имя)',
    'шаг 2 — рабочая почта',
    'шаг 3 — вопрос на знание регламентов компании',
    'шаг 4 — викторина (выбор ответа)',
  ]
  return titles[stepIndex] ?? `шаг ${stepIndex + 1}`
}

/** Человекочитаемое описание шага мастера (совпадает с экранами формы). */
function stepTitle(stepIndex) {
  const titles = [
    'шаг 1 из 4 — как к вам обращаться (имя)',
    'шаг 2 из 4 — рабочая почта',
    'шаг 3 из 4 — вопрос на знание регламентов компании',
    'шаг 4 из 4 — викторина (выбор ответа)',
  ]
  return titles[stepIndex] ?? `шаг ${stepIndex + 1} из 4`
}

/** Сброс маркера «первое открытие» после успешной заявки — следующий заход на /register начнёт воронку заново. */
export function resetRegisterSessionMarkers() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(SK_REG_FIRST_OPEN)
    sessionStorage.removeItem(SK_REG_FUNNEL_ACTIVE)
  } catch {
    /* ignore */
  }
}

/** Первое открытие формы (не F5). Очистка старых session_events — в RegisterView при заходе на форму без активной воронки. */
export async function logRegisterFirstOpenOnce() {
  if (typeof window === 'undefined') return
  if (sessionStorage.getItem(SK_REG_FIRST_OPEN) === '1') return
  sessionStorage.setItem(SK_REG_FIRST_OPEN, '1')
  const iso = occurredNow()
  const p = pathNow()
  await logSessionEvent({
    occurredAt: iso,
    kind: 'register_page_first_open',
    label: truncateLabel(
      'Первый вход / первое открытие страницы регистрации. По времени совпадает с фиксацией идентификатора участника в этом браузере (cookie).',
    ),
    path: p,
  })
}

export async function logRegisterStepNext(fromStep, toStep) {
  const iso = occurredNow()
  const p = pathNow()
  const fromT = stepTitleShort(fromStep)
  const toT = toStep == null ? 'отправка заявки' : stepTitleShort(toStep)
  await logSessionEvent({
    occurredAt: iso,
    kind: 'register_step_next',
    label: truncateLabel(`Переход по сценарию регистрации: «${fromT}» на «${toT}».`),
    stepIndex: fromStep,
    path: p,
    meta: {
      fromStep,
      toStep: toStep == null ? 'submit' : toStep,
    },
  })
}

/**
 * @param {number} stepIndex
 * @param {{ key: string, label: string, value: string }[]} changes
 */
export async function logRegisterFieldChange(stepIndex, changes) {
  if (!changes.length) return
  const iso = occurredNow()
  const p = pathNow()
  await logSessionEvent({
    occurredAt: iso,
    kind: 'register_field_input',
    label: truncateLabel(`Данные введены или изменены (${stepTitle(stepIndex)}).`),
    stepIndex: stepIndex,
    path: p,
    meta: {
      stepIndex,
      changes,
    },
  })
}

/** Возврат на предыдущий шаг (кнопка «Назад»). */
export async function logRegisterStepBack(fromStep, toStep) {
  const iso = occurredNow()
  const p = pathNow()
  await logSessionEvent({
    occurredAt: iso,
    kind: 'register_step_back',
    label: truncateLabel(
      `Переход назад по сценарию регистрации: «${stepTitleShort(fromStep)}» на «${stepTitleShort(toStep)}».`,
    ),
    stepIndex: toStep,
    path: p,
    meta: {
      fromStep,
      toStep,
    },
  })
}

export async function logRegisterFlowComplete(returning) {
  const iso = occurredNow()
  const p = pathNow()
  const label = returning
    ? 'Повторная попытка регистрации: открыта страница «заявка уже была отправлена».'
    : 'Регистрация завершена: открыта страница успеха.'
  await logSessionEvent({
    occurredAt: iso,
    kind: returning ? 'register_repeat_open' : 'register_flow_complete',
    label: truncateLabel(label),
    path: p,
  })
}

/** Закрытие вкладки / уход с документа (не SPA-переход). Не вызывать при полной перезагрузке (F5). */
export async function logRegisterSiteLeave() {
  const iso = occurredNow()
  const p = pathNow()
  await logSessionEvent({
    occurredAt: iso,
    kind: 'register_site_leave',
    label: truncateLabel(
      'Выгрузка страницы: закрытие вкладки, переход на другой сайт или снятие документа браузером.',
    ),
    path: p,
  })
}
