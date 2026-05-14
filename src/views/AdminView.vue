<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import * as XLSX from 'xlsx'
import { RouterLink } from 'vue-router'
import { authLogin, fetchRegistrations, clearRegistrations, fetchSiteVisits, clearSiteVisits, fetchSessionEvents } from '../lib/apiAdmin'
import { adminLoggedIn, syncAdminSession } from '../composables/useAdminSession'
import { formatAdminWhen, registrationFlowLabel, sessionEventKindLabel, formatStepDataMetaKey, formatSessionEventMetaValue } from '../lib/adminFormat'
import { getOrCreateAdminParticipantId } from '../lib/participantId'

const loginInput = ref('')
const passwordInput = ref('')
const authError = ref('')
const listError = ref('')
const rows = ref([])
const visitRows = ref([])
const eventRows = ref([])
const expandedId = ref(null)

/** Включено по умолчанию: скрыть сессию консоли `/admin` и маршруты панели (не трогать воронку регистрации). */
const hidePageDetails = ref(true)

const POLL_MS = 8000
let pollTimer = null

function startPoll() {
  stopPoll()
  pollTimer = setInterval(() => refresh(), POLL_MS)
}

function stopPoll() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

/** Одна строка = id сессии: визит, заявка и события с тем же participant id сливаются. */
const mergedSessions = computed(() => {
  const map = new Map()
  for (const v of visitRows.value) {
    if (!v?.id) continue
    map.set(v.id, { id: v.id, visit: v, registration: null })
  }
  for (const r of rows.value) {
    if (!r?.id) continue
    const cur = map.get(r.id)
    if (cur) cur.registration = r
    else map.set(r.id, { id: r.id, visit: null, registration: r })
  }
  for (const e of eventRows.value) {
    const pid = e?.participantId
    if (!pid) continue
    if (!map.has(pid)) map.set(pid, { id: pid, visit: null, registration: null })
  }
  const list = [...map.values()]
  list.sort((a, b) => sessionLatestAtMs(b) - sessionLatestAtMs(a))
  return list
})

function normalizePath(p) {
  if (!p || typeof p !== 'string') return ''
  const x = p.trim().split('?')[0]
  return x.replace(/\/+$/, '') || '/'
}

/** Маршруты интерфейса админки (форма входа и панель). */
function isAdminRoutePath(p) {
  const n = normalizePath(p)
  return n === '/admin' || n.startsWith('/admin/')
}

const mergedSessionsTable = computed(() => {
  const list = mergedSessions.value
  if (!hidePageDetails.value) return list
  return list.filter((s) => !shouldHideSessionInPrivacyMode(s))
})

/** Сессия только из cookie консоли `/admin` (отдельный participant id). */
function isAdminConsoleSession(s) {
  try {
    return s.id === getOrCreateAdminParticipantId()
  } catch {
    return false
  }
}

/** Скрывать при включённом «без админки»: отдельная консольная сессия или старые строки «только /admin» без заявки. */
function shouldHideSessionInPrivacyMode(s) {
  if (isAdminConsoleSession(s)) return true
  return isAdminOnlySession(s)
}

/** Только визит в /admin без заявки — для старых данных, где события ещё писались в общий id. */
function isAdminOnlySession(s) {
  if (s.registration) return false
  const visitPath = normalizePath(s.visit?.path)
  if (visitPath && isAdminRoutePath(visitPath)) return true
  if (!s.visit) {
    const routes = eventRows.value.filter((e) => e.participantId === s.id && e.kind === 'route')
    if (!routes.length) return false
    return routes.every((e) => isAdminRoutePath(e.path))
  }
  return false
}

function sessionLatestAtMs(s) {
  const tVisit = s.visit?.openedAt ? new Date(s.visit.openedAt).getTime() : 0
  const tReg = s.registration?.submittedAt ? new Date(s.registration.submittedAt).getTime() : 0
  let tEv = 0
  for (const e of eventRows.value) {
    if (e.participantId !== s.id) continue
    if (hidePageDetails.value && e.kind === 'route' && isAdminRoutePath(e.path)) continue
    const t = new Date(e.occurredAt).getTime()
    if (t > tEv) tEv = t
  }
  return Math.max(tVisit, tReg, tEv)
}

function sessionLatestIso(s) {
  const ms = sessionLatestAtMs(s)
  return ms ? new Date(ms).toISOString() : ''
}

function sessionStatusLabel(s) {
  const hasEv = eventRows.value.some((e) => e.participantId === s.id)
  if (s.visit && s.registration) return hasEv ? 'Визит, шаги и заявка' : 'Визит и заявка'
  if (s.registration) return hasEv ? 'Заявка и шаги' : 'Только заявка'
  if (s.visit) return hasEv ? 'Визит и шаги' : 'Только визит'
  return hasEv ? 'Только шаги' : '—'
}

/** Снимок телеметрии: визит + тонкий слой из заявки (без дублирования JSON). */
function sessionTelemetry(s) {
  const v =
    s.visit?.telemetry && typeof s.visit.telemetry === 'object' && !Array.isArray(s.visit.telemetry)
      ? { ...s.visit.telemetry }
      : {}
  const r =
    s.registration?.telemetry &&
    typeof s.registration.telemetry === 'object' &&
    !Array.isArray(s.registration.telemetry)
      ? s.registration.telemetry
      : {}
  const merged = { ...v, ...r }
  return Object.keys(merged).length ? merged : null
}

/** Ключи meta, которые не показываем в хронологии (дублируют label/телеметрию). */
const META_KEYS_HIDE = new Set([
  'fromStep',
  'toStep',
  'requestIp',
  'quizAnswer',
  'quizQuestionId',
  'stepIndex',
  'afterBack',
])

function telemetryIpCombined(t) {
  if (!t || typeof t !== 'object') return '—'
  const client = (t.ip && String(t.ip).trim()) || ''
  const srv = t.requestIp != null ? String(t.requestIp).trim() : ''
  if (client && srv && client === srv) return client
  if (client && srv) return `${client} · сервер: ${srv}`
  if (client) return client
  if (srv) return `сервер: ${srv}`
  return '—'
}

function sessionIp(s) {
  return telemetryIpCombined(sessionTelemetry(s))
}

function sessionLastPath(s) {
  if (hidePageDetails.value) {
    const routes = eventRows.value.filter((e) => e.participantId === s.id && e.kind === 'route')
    const publicRoutes = routes.filter((e) => !isAdminRoutePath(e.path))
    if (publicRoutes.length) {
      publicRoutes.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      return publicRoutes[0].path || '—'
    }
    const vp = s.visit?.path || ''
    if (vp && !isAdminRoutePath(vp)) return vp
    return '—'
  }
  const routes = eventRows.value.filter((e) => e.participantId === s.id && e.kind === 'route')
  if (!routes.length) return s.visit?.path || '—'
  routes.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
  return routes[0].path || s.visit?.path || '—'
}

function eventsForSession(id) {
  let list = eventRows.value
    .filter((e) => e.participantId === id)
    .slice()
    .sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime())
  if (hidePageDetails.value) {
    list = list.filter((e) => !(e.kind === 'route' && isAdminRoutePath(e.path)))
  }
  return list
}

/** Ответ викторины не показываем в meta хронологии — он уже в блоке заявки (victorina). */
function omitTimelineMetaEntry(eventKind, key, value) {
  return (
    eventKind === 'register_field_input' &&
    key === 'changes' &&
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((c) => c && typeof c === 'object' && c.key === 'quizAnswer')
  )
}

function eventMetaEntries(ev) {
  if (!ev?.meta || typeof ev.meta !== 'object') return []
  return Object.entries(ev.meta)
    .filter(([key]) => !META_KEYS_HIDE.has(key))
    .filter(([key, value]) => !(key === 'returning' && !value))
    .filter(([key, value]) => !omitTimelineMetaEntry(ev.kind, key, value))
    .map(([key, value]) => ({
      key,
      value: formatSessionEventMetaValue(key, value),
    }))
}

function exportEventMeta(meta, eventKind = '') {
  if (!meta || typeof meta !== 'object') return ''
  const out = { ...meta }
  for (const k of META_KEYS_HIDE) delete out[k]
  if (out.returning === false || out.returning === 0 || out.returning === '0') delete out.returning
  for (const k of Object.keys(out)) {
    if (omitTimelineMetaEntry(eventKind, k, out[k])) delete out[k]
  }
  const parts = []
  for (const [k, v] of Object.entries(out)) {
    parts.push(`${formatStepDataMetaKey(k)}: ${formatSessionEventMetaValue(k, v)}`)
  }
  return parts.length ? parts.join('; ') : ''
}

async function refresh() {
  listError.value = ''
  try {
    const [regData, visitData, evData] = await Promise.all([
      fetchRegistrations(),
      fetchSiteVisits(),
      fetchSessionEvents(),
    ])
    rows.value = regData
    visitRows.value = visitData
    eventRows.value = evData
  } catch (e) {
    listError.value = e.message || 'Не удалось загрузить данные'
    rows.value = []
    visitRows.value = []
    eventRows.value = []
  }
}

async function tryLogin() {
  authError.value = ''
  try {
    await authLogin(loginInput.value.trim(), passwordInput.value)
    passwordInput.value = ''
    await syncAdminSession()
  } catch (e) {
    authError.value = e.message || 'Ошибка входа'
  }
}

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

function exportExcel() {
  const wb = XLSX.utils.book_new()
  const hide = hidePageDetails.value
  const tableRows = mergedSessionsTable.value
  const sheet = XLSX.utils.json_to_sheet(
    tableRows.map((s) => {
      const v = s.visit
      const r = s.registration
      const base = {
        id: s.id,
        Статус: sessionStatusLabel(s),
        'Страница (последняя)': sessionLastPath(s),
        'Визит в БД (время, сервер)': v ? formatAdminWhen(v.openedAt) : '',
        'Заявка (время)': r ? formatAdminWhen(r.submittedAt) : '',
        Имя: r?.fullName || '',
        'E-mail': r?.email || '',
        Сценарий: r ? registrationFlowLabel(r.flow) : '',
        Номер: r?.raffleNumber || '',
        'Опрос (фишинг)': r ? (r.mainPrizeOptIn ? 'да' : 'нет') : '',
        'IP (клиент / сервер)': sessionIp(s) === '—' ? '' : sessionIp(s),
        'User-Agent': sessionTelemetry(s)?.userAgent || '',
        'Часовой пояс': sessionTelemetry(s)?.timezone || '',
        'Платформа': sessionTelemetry(s)?.platform || '',
        'Визит ISO (сервер)': v?.openedAt || '',
        'Заявка ISO': r?.submittedAt || '',
      }
      if (!hide) {
        base['Путь (визит)'] = v?.path || ''
        base['Последний маршрут (все маршруты)'] = (() => {
          const routes = eventRows.value.filter((e) => e.participantId === s.id && e.kind === 'route')
          if (!routes.length) return v?.path || ''
          routes.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
          return routes[0].path || v?.path || ''
        })()
      }
      return base
    }),
  )
  XLSX.utils.book_append_sheet(wb, sheet, 'Журнал')

  const evSource = hide
    ? eventRows.value.filter((e) => !(e.kind === 'route' && isAdminRoutePath(e.path)))
    : [...eventRows.value]
  const evSheet = XLSX.utils.json_to_sheet(
    evSource
      .sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime())
      .map((e) => {
        const row = {
          'id сессии': e.participantId,
          Время: formatAdminWhen(e.occurredAt),
          'Время ISO': e.occurredAt,
          Тип: sessionEventKindLabel(e.kind),
          kind: e.kind,
          'Шаг формы': e.stepIndex != null ? e.stepIndex : '',
          Подпись: e.label || '',
          Данные: exportEventMeta(e.meta, e.kind),
        }
        if (!hide) {
          row.Путь = e.path || ''
        }
        return row
      }),
  )
  XLSX.utils.book_append_sheet(wb, evSheet, 'Шаги и страницы')

  XLSX.writeFile(wb, `admin-export-${Date.now()}.xlsx`)
}

async function clearRegistrationsOnly() {
  if (!window.confirm('Удалить все заявки (регистрации)? Журнал посещений не трогаем.')) return
  try {
    await clearRegistrations()
    await refresh()
  } catch (e) {
    listError.value = e.message || 'Ошибка очистки заявок'
  }
}

async function clearVisitsOnly() {
  if (
    !window.confirm(
      'Удалить журнал открытий сайта и хронологию шагов/страниц? Заявки не трогаем.',
    )
  )
    return
  try {
    await clearSiteVisits()
    await refresh()
  } catch (e) {
    listError.value = e.message || 'Ошибка очистки журнала'
  }
}

watch(
  adminLoggedIn,
  (v) => {
    if (v) {
      startPoll()
      refresh()
    } else {
      stopPoll()
      rows.value = []
      visitRows.value = []
      eventRows.value = []
    }
  },
  { immediate: true },
)

onMounted(async () => {
  await syncAdminSession()
})

onUnmounted(() => {
  stopPoll()
})
</script>

<template>
  <div class="admin">
    <div class="admin__wrap">
      <RouterLink to="/register" class="admin__home">← К регистрации</RouterLink>

      <template v-if="!adminLoggedIn">
        <div class="card">
          <h1 class="admin__title">Админка</h1>
          <p class="admin__lead">Вход по учётной записи администратора (сессия в cookie, данные на сервере).</p>
          <form class="auth-form" @submit.prevent="tryLogin">
            <label class="field">
              <span class="field__label" for="admin-login">Логин</span>
              <input
                id="admin-login"
                v-model="loginInput"
                type="text"
                class="field__input"
                name="username"
                autocomplete="username"
              />
            </label>
            <label class="field">
              <span class="field__label" for="admin-password">Пароль</span>
              <input
                id="admin-password"
                v-model="passwordInput"
                type="password"
                class="field__input"
                name="password"
                autocomplete="current-password"
              />
            </label>
            <p v-if="authError" class="field__error">{{ authError }}</p>
            <button type="submit" class="btn btn--primary">Войти</button>
          </form>
        </div>
      </template>

      <template v-else>
        <header class="admin__toolbar">
          <div>
            <h1 class="admin__title">Панель</h1>
            <p class="admin__meta">
              В таблице: {{ mergedSessionsTable.length }} · всего в журнале: {{ mergedSessions.length }} (визитов:
              {{ visitRows.length }}, заявок: {{ rows.length }}, событий: {{ eventRows.length }})
              <template v-if="hidePageDetails && mergedSessionsTable.length < mergedSessions.length">
                · скрыто записей (консоль /admin и пр.): {{ mergedSessions.length - mergedSessionsTable.length }}
              </template>
            </p>
            <label class="admin__privacy">
              <input v-model="hidePageDetails" type="checkbox" />
              <span>Скрыть сессию консоли `/admin` и её маршруты (воронка регистрации не скрывается)</span>
            </label>
            <p v-if="listError" class="field__error">{{ listError }}</p>
          </div>
          <div class="admin__actions">
            <button type="button" class="btn btn--ghost" @click="refresh">Обновить</button>
            <button type="button" class="btn btn--ghost" @click="exportExcel">Экспорт Excel</button>
            <button type="button" class="btn btn--danger" @click="clearRegistrationsOnly">Очистить заявки</button>
            <button type="button" class="btn btn--danger" @click="clearVisitsOnly">Очистить визиты</button>
          </div>
        </header>

        <div v-if="mergedSessionsTable.length === 0" class="card card--empty">
          <template v-if="mergedSessions.length > 0">
            Все записи скрыты фильтром «скрыть сессию консоли /admin» — отключите чекбокс или дождитесь данных по участникам.
          </template>
          <template v-else>
            Записей пока нет — не было открытий с телеметрией или заявок, либо база пуста.
          </template>
        </div>

        <div v-else class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Последнее событие</th>
                <th>Статус</th>
                <th>Страница (последняя)</th>
                <th>Имя</th>
                <th>E-mail</th>
                <th>IP (клиент / сервер)</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <template v-for="s in mergedSessionsTable" :key="s.id">
                <tr class="table__row" @click="toggleExpand(s.id)">
                  <td>{{ formatAdminWhen(sessionLatestIso(s)) }}</td>
                  <td>{{ sessionStatusLabel(s) }}</td>
                  <td class="table__mono">{{ sessionLastPath(s) }}</td>
                  <td>{{ s.registration?.fullName || '—' }}</td>
                  <td class="table__mono">{{ s.registration?.email || '—' }}</td>
                  <td class="table__mono">{{ sessionIp(s) }}</td>
                  <td class="table__toggle">{{ expandedId === s.id ? '▼' : '▶' }}</td>
                </tr>
                <tr v-if="expandedId === s.id" class="table__detail">
                  <td colspan="7">
                    <div class="detail">
                      <p class="detail__idline">
                        <strong>id сессии</strong> (общий ключ визита и заявки, если оба события есть):
                        <span class="detail__mono">{{ s.id }}</span>
                      </p>

                      <section v-if="s.visit || s.registration" class="detail__block">
                        <h3 class="detail__h">Событие</h3>
                        <p v-if="!s.visit && s.registration" class="detail__muted">
                          В базе сохранена заявка с этим id; в журнале открытий сайта строки с тем же id нет (часто у старых
                          заявок, при открытии в другой вкладке или если визит не отправился на сервер).
                        </p>
                        <p v-if="s.visit && !s.registration" class="detail__muted">
                          В журнале визитов есть открытие с этим id; заявки с тем же id нет — форма не отправлялась.
                        </p>
                        <template v-if="s.visit">
                          <p>
                            <strong>Время визита в БД (сервер, первый запрос):</strong>
                            {{ formatAdminWhen(s.visit.openedAt) }}
                          </p>
                          <p
                            v-if="
                              s.visit.path &&
                              (!hidePageDetails || !isAdminRoutePath(s.visit.path))
                            "
                          >
                            <strong>URL этого визита:</strong> <span class="detail__mono">{{ s.visit.path }}</span>
                          </p>
                        </template>
                        <template v-if="s.registration">
                          <p><strong>Заявка:</strong> {{ formatAdminWhen(s.registration.submittedAt) }}</p>
                          <p><strong>Сценарий:</strong> {{ registrationFlowLabel(s.registration.flow) }}</p>
                          <p><strong>Имя:</strong> {{ s.registration.fullName }}</p>
                          <p>
                            <strong>E-mail:</strong> <span class="detail__mono">{{ s.registration.email }}</span>
                          </p>
                          <template v-if="s.registration.raffleNumber">
                            <p>
                              <strong>Участие:</strong> номер <strong>{{ s.registration.raffleNumber }}</strong>,
                              опрос (фишинг): {{ s.registration.mainPrizeOptIn ? 'да' : 'нет' }}
                            </p>
                          </template>
                          <template v-if="s.registration.victorina?.length">
                            <h4 class="detail__subh">Ответ опроса</h4>
                            <ol class="detail__ol">
                              <li v-for="(v, i) in s.registration.victorina" :key="i" class="detail__qa">
                                <p class="detail__q">{{ v.question }}</p>
                                <p class="detail__a">
                                  <span class="detail__badge">{{ v.answerValue }}</span>
                                  {{ v.answerLabel }}
                                </p>
                              </li>
                            </ol>
                          </template>
                          <p v-else-if="s.registration.flow === 'declined_main_prize'" class="detail__muted">
                            Опрос не проходился (ранний выход из сценария).
                          </p>
                        </template>
                      </section>

                      <section v-if="eventsForSession(s.id).length" class="detail__block">
                        <h3 class="detail__h">
                          {{
                            hidePageDetails
                              ? 'Хронология (без маршрутов /admin)'
                              : 'Хронология (страницы и шаги)'
                          }}
                        </h3>
                        <ol class="detail__timeline">
                          <li v-for="ev in eventsForSession(s.id)" :key="ev.id" class="detail__timeline-item">
                            <span class="detail__timeline-time">{{ formatAdminWhen(ev.occurredAt) }}</span>
                            <span class="detail__timeline-kind">{{ sessionEventKindLabel(ev.kind) }}</span>
                            <span
                              v-if="ev.path && (!hidePageDetails || !isAdminRoutePath(ev.path))"
                              class="detail__mono detail__timeline-path"
                              >{{ ev.path }}</span
                            >
                            <span v-if="ev.label" class="detail__timeline-label">{{ ev.label }}</span>
                            <dl v-if="eventMetaEntries(ev).length" class="detail__meta-dl">
                              <template v-for="row in eventMetaEntries(ev)" :key="row.key">
                                <dt>{{ formatStepDataMetaKey(row.key) }}</dt>
                                <dd class="detail__mono">{{ row.value }}</dd>
                              </template>
                            </dl>
                          </li>
                        </ol>
                      </section>

                      <section v-if="sessionTelemetry(s)" class="detail__block">
                        <h3 class="detail__h">Технические данные</h3>
                        <p v-if="s.visit && s.registration" class="detail__muted">
                          Снимок на момент отправки заявки (для визита без заявки — на момент открытия).
                        </p>
                        <dl class="detail__dl">
                          <dt>IP (клиент / сервер запроса)</dt>
                          <dd class="detail__mono">{{ sessionIp(s) }}</dd>
                          <dt>User-Agent</dt>
                          <dd class="detail__mono">{{ sessionTelemetry(s)?.userAgent || '—' }}</dd>
                          <dt>Платформа</dt>
                          <dd>{{ sessionTelemetry(s)?.platform || '—' }}</dd>
                          <dt>Часовой пояс</dt>
                          <dd>{{ sessionTelemetry(s)?.timezone || '—' }}</dd>
                        </dl>
                      </section>
                      <section v-else class="detail__block">
                        <p class="detail__muted">Телеметрия не сохранена.</p>
                      </section>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.admin {
  padding: 32px 20px 72px;
  background: var(--page-background, #f9fafb);
  min-height: calc(100dvh - var(--header-height));
}

.admin__wrap {
  max-width: 1100px;
  margin: 0 auto;
}

.admin__home {
  display: inline-block;
  font-size: 14px;
  font-weight: 600;
  color: var(--blue-default);
  text-decoration: none;
  margin-bottom: 20px;
}

.admin__home:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.card {
  background: #fff;
  border: 1px solid #e0e0e2;
  padding: 28px 24px;
  box-shadow: 0 8px 28px rgba(10, 22, 47, 0.06);
}

.card--empty {
  color: #6c6c6c;
}

.admin__title {
  font-family: var(--font-display);
  font-size: clamp(22px, 3vw, 28px);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0 0 8px;
  color: var(--gray-100);
}

.admin__lead {
  margin: 0 0 20px;
  color: #3b3b3b;
  line-height: 1.5;
}

.admin__meta {
  margin: 4px 0 0;
  font-size: 14px;
  color: #6c6c6c;
}

.admin__privacy {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 14px;
  max-width: 520px;
  font-size: 14px;
  line-height: 1.45;
  color: #3b3b3b;
  cursor: pointer;
  user-select: none;
}

.admin__privacy input {
  margin-top: 3px;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  cursor: pointer;
}

.admin__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.admin__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 320px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field__label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #3b3b3b;
}

.field__input {
  font: inherit;
  font-size: 16px;
  padding: 12px 14px;
  border: 1px solid #cecece;
}

.field__error {
  font-size: 14px;
  color: var(--system-red);
  margin: 0;
}

.btn {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  padding: 12px 18px;
  border: none;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.btn--primary {
  background: var(--system-orange);
  color: #fff;
  align-self: flex-start;
}

.btn--primary:hover {
  background: var(--orange-hover);
}

.btn--ghost {
  background: #fff;
  color: var(--blue-default);
  border: 1px solid #cecece;
}

.btn--ghost:hover {
  border-color: var(--blue-default);
  background: #f3f6fc;
}

.btn--danger {
  background: #fff;
  color: var(--system-red);
  border: 1px solid var(--system-red);
}

.btn--danger:hover {
  background: #fff5f5;
}

.table-wrap {
  overflow-x: auto;
  background: #fff;
  border: 1px solid #e0e0e2;
  box-shadow: 0 8px 28px rgba(10, 22, 47, 0.06);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table th {
  text-align: left;
  padding: 12px 14px;
  background: #f3f6fc;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--blue-default);
  border-bottom: 1px solid #e0e0e2;
}

.table td {
  padding: 12px 14px;
  border-bottom: 1px solid #eee;
  vertical-align: top;
}

.table__row {
  cursor: pointer;
  transition: background 0.15s;
}

.table__row:hover {
  background: #fafbfd;
}

.table__mono {
  font-family: ui-monospace, monospace;
  font-size: 13px;
  word-break: break-all;
}

.table__toggle {
  text-align: center;
  color: var(--blue-default);
  width: 40px;
}

.table__detail td {
  padding: 0;
  background: #fafafa;
  border-bottom: 1px solid #e0e0e2;
}

.detail {
  padding: 20px 24px 24px;
}

.detail__block {
  margin-bottom: 20px;
}

.detail__block:last-child {
  margin-bottom: 0;
}

.detail__h {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--blue-default);
  margin: 0 0 10px;
}

.detail__subh {
  font-size: 13px;
  font-weight: 600;
  margin: 14px 0 8px;
  color: var(--gray-100);
}

.detail__idline {
  margin: 0 0 16px;
  font-size: 13px;
  color: #3b3b3b;
}

.detail__block p {
  margin: 0 0 6px;
  line-height: 1.5;
  color: #3b3b3b;
}

.detail__dl {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 8px 16px;
  margin: 0;
}

.detail__dl dt {
  margin: 0;
  font-weight: 600;
  color: #6c6c6c;
  font-size: 13px;
}

.detail__dl dd {
  margin: 0;
  color: var(--gray-100);
  font-size: 13px;
}

.detail__mono {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  word-break: break-all;
}

.detail__ol {
  margin: 0;
  padding-left: 1.2em;
}

.detail__qa {
  margin-bottom: 14px;
}

.detail__q {
  font-weight: 600;
  margin: 0 0 6px;
  color: var(--gray-100);
}

.detail__a {
  margin: 0;
  color: #3b3b3b;
  line-height: 1.45;
}

.detail__badge {
  display: inline-block;
  margin-right: 8px;
  padding: 2px 8px;
  background: var(--blue-default);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  border-radius: 2px;
}

.detail__muted {
  color: #6c6c6c;
  font-size: 14px;
}

.detail__timeline {
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
  counter-reset: ev;
}

.detail__timeline-item {
  position: relative;
  padding: 10px 0 10px 28px;
  border-left: 2px solid #e0e0e2;
  margin-left: 8px;
}

.detail__timeline-item:last-child {
  border-left-color: transparent;
}

.detail__timeline-item::before {
  counter-increment: ev;
  content: counter(ev);
  position: absolute;
  left: -11px;
  top: 8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--blue-default);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
}

.detail__timeline-time {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--gray-100);
  margin-bottom: 4px;
}

.detail__timeline-kind {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--blue-default);
  margin-right: 8px;
}

.detail__timeline-path {
  display: block;
  font-size: 12px;
  margin-top: 4px;
  word-break: break-all;
}

.detail__timeline-label {
  display: block;
  font-size: 14px;
  margin-top: 4px;
  color: #3b3b3b;
}

.detail__meta-dl {
  display: grid;
  grid-template-columns: minmax(120px, 160px) 1fr;
  gap: 6px 12px;
  margin: 10px 0 0;
  padding: 10px 12px;
  background: #f7f8fb;
  border: 1px solid #e8e8ea;
  font-size: 13px;
}

.detail__meta-dl dt {
  font-weight: 600;
  color: #555;
}

.detail__meta-dl dd {
  margin: 0;
  word-break: break-word;
  white-space: pre-line;
}

@media (max-width: 1024px) {
  .admin {
    min-height: calc(100dvh - var(--header-height-mobile));
  }

  .detail__dl {
    grid-template-columns: 1fr;
  }
}
</style>
