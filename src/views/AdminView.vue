<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import * as XLSX from 'xlsx'
import { RouterLink } from 'vue-router'
import { authLogin, fetchRegistrations, clearRegistrations, fetchSiteVisits, clearSiteVisits } from '../lib/apiAdmin'
import { adminLoggedIn, syncAdminSession } from '../composables/useAdminSession'
import { formatAdminWhen, registrationFlowLabel } from '../lib/adminFormat'

const loginInput = ref('')
const passwordInput = ref('')
const authError = ref('')
const listError = ref('')
const rows = ref([])
const visitRows = ref([])
const expandedId = ref(null)

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

/** Одна строка = id сессии: открытие сайта и заявка с тем же id сливаются. */
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
  const list = [...map.values()]
  list.sort((a, b) => sessionLatestAtMs(b) - sessionLatestAtMs(a))
  return list
})

function sessionLatestAtMs(s) {
  const tVisit = s.visit?.openedAt ? new Date(s.visit.openedAt).getTime() : 0
  const tReg = s.registration?.submittedAt ? new Date(s.registration.submittedAt).getTime() : 0
  return Math.max(tVisit, tReg)
}

function sessionLatestIso(s) {
  const ms = sessionLatestAtMs(s)
  return ms ? new Date(ms).toISOString() : ''
}

function sessionStatusLabel(s) {
  if (s.visit && s.registration) return 'Визит и заявка'
  if (s.registration) return 'Только заявка'
  return 'Только визит'
}

/** В таблице и в «Технических данных» — одна телеметрия: с заявки, если есть, иначе с визита. */
function sessionTelemetry(s) {
  return s.registration?.telemetry || s.visit?.telemetry || null
}

function sessionIp(s) {
  return visitIp(sessionTelemetry(s))
}

async function refresh() {
  listError.value = ''
  try {
    const [regData, visitData] = await Promise.all([fetchRegistrations(), fetchSiteVisits()])
    rows.value = regData
    visitRows.value = visitData
  } catch (e) {
    listError.value = e.message || 'Не удалось загрузить данные'
    rows.value = []
    visitRows.value = []
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

function visitIp(t) {
  if (!t || typeof t !== 'object') return '—'
  return t.ip || '—'
}

function exportExcel() {
  const wb = XLSX.utils.book_new()
  const sheet = XLSX.utils.json_to_sheet(
    mergedSessions.value.map((s) => {
      const v = s.visit
      const r = s.registration
      return {
        id: s.id,
        Статус: sessionStatusLabel(s),
        'Открытие (время)': v ? formatAdminWhen(v.openedAt) : '',
        Путь: v?.path || '',
        'Заявка (время)': r ? formatAdminWhen(r.submittedAt) : '',
        Имя: r?.fullName || '',
        'E-mail': r?.email || '',
        Сценарий: r ? registrationFlowLabel(r.flow) : '',
        Номер: r?.raffleNumber || '',
        'Опрос (фишинг)': r ? (r.mainPrizeOptIn ? 'да' : 'нет') : '',
        'IP (клиент)': sessionTelemetry(s)?.ip || '',
        'User-Agent': sessionTelemetry(s)?.userAgent || '',
        'Часовой пояс': sessionTelemetry(s)?.timezone || '',
        'Платформа': sessionTelemetry(s)?.platform || '',
        'Открытие ISO': v?.openedAt || '',
        'Заявка ISO': r?.submittedAt || '',
      }
    }),
  )
  XLSX.utils.book_append_sheet(wb, sheet, 'Журнал')
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
  if (!window.confirm('Удалить весь журнал открытий сайта? Заявки не трогаем.')) return
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
              Записей в журнале: {{ mergedSessions.length }} (визитов: {{ visitRows.length }}, заявок:
              {{ rows.length }})
            </p>
            <p v-if="listError" class="field__error">{{ listError }}</p>
          </div>
          <div class="admin__actions">
            <button type="button" class="btn btn--ghost" @click="refresh">Обновить</button>
            <button type="button" class="btn btn--ghost" @click="exportExcel">Экспорт Excel</button>
            <button type="button" class="btn btn--danger" @click="clearRegistrationsOnly">Очистить заявки</button>
            <button type="button" class="btn btn--danger" @click="clearVisitsOnly">Очистить визиты</button>
          </div>
        </header>

        <div v-if="mergedSessions.length === 0" class="card card--empty">
          Записей пока нет — не было открытий с телеметрией или заявок, либо база пуста.
        </div>

        <div v-else class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Последнее событие</th>
                <th>Статус</th>
                <th>Путь</th>
                <th>Имя</th>
                <th>E-mail</th>
                <th>IP</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <template v-for="s in mergedSessions" :key="s.id">
                <tr class="table__row" @click="toggleExpand(s.id)">
                  <td>{{ formatAdminWhen(sessionLatestIso(s)) }}</td>
                  <td>{{ sessionStatusLabel(s) }}</td>
                  <td class="table__mono">{{ s.visit?.path || '—' }}</td>
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
                          <p><strong>Открытие:</strong> {{ formatAdminWhen(s.visit.openedAt) }}</p>
                          <p>
                            <strong>Путь:</strong> <span class="detail__mono">{{ s.visit.path }}</span>
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

                      <section v-if="sessionTelemetry(s)" class="detail__block">
                        <h3 class="detail__h">Технические данные</h3>
                        <p v-if="s.visit && s.registration" class="detail__muted">
                          Снимок на момент отправки заявки (для визита без заявки — на момент открытия).
                        </p>
                        <dl class="detail__dl">
                          <dt>IP (клиент, ipify)</dt>
                          <dd>{{ sessionTelemetry(s)?.ip || '—' }}</dd>
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

@media (max-width: 1024px) {
  .admin {
    min-height: calc(100dvh - var(--header-height-mobile));
  }

  .detail__dl {
    grid-template-columns: 1fr;
  }
}
</style>
