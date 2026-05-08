<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import * as XLSX from 'xlsx'
import { RouterLink } from 'vue-router'
import { authLogin, fetchRegistrations, clearRegistrations } from '../lib/apiAdmin'
import { adminLoggedIn, syncAdminSession } from '../composables/useAdminSession'

const loginInput = ref('')
const passwordInput = ref('')
const authError = ref('')
const listError = ref('')
const rows = ref([])
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

const sortedRows = computed(() => {
  const list = [...rows.value]
  list.sort((a, b) => {
    const ta = new Date(a.submittedAt || 0).getTime()
    const tb = new Date(b.submittedAt || 0).getTime()
    return tb - ta
  })
  return list
})

async function refresh() {
  listError.value = ''
  try {
    rows.value = await fetchRegistrations()
  } catch (e) {
    listError.value = e.message || 'Не удалось загрузить список'
    rows.value = []
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

function rowKey(row) {
  return row.id
}

function formatWhen(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleString('ru-RU', {
      dateStyle: 'short',
      timeStyle: 'medium',
    })
  } catch {
    return iso
  }
}

function flowLabel(flow) {
  if (flow === 'full_registration') return 'Полная регистрация'
  if (flow === 'declined_main_prize') return 'Отказ от главного приза'
  return flow || '—'
}

function exportExcel() {
  const data = sortedRows.value.map((r) => ({
    Время: formatWhen(r.submittedAt),
    Имя: r.fullName || '',
    'E-mail': r.email || '',
    Сценарий: flowLabel(r.flow),
    'Номер розыгрыша': r.raffleNumber || '',
    'Главный приз': r.mainPrizeOptIn ? 'да' : 'нет',
    IP: r.telemetry?.ip || '',
    'User-Agent': r.telemetry?.userAgent || '',
    Язык: r.telemetry?.language || '',
    'Часовой пояс': r.telemetry?.timezone || '',
    Referrer: r.telemetry?.referrer || '',
    'Дата (ISO)': r.submittedAt || '',
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Заявки')
  XLSX.writeFile(wb, `registrations-${Date.now()}.xlsx`)
}

async function clearAll() {
  if (!window.confirm('Удалить все заявки в базе?')) return
  try {
    await clearRegistrations()
    await refresh()
  } catch (e) {
    listError.value = e.message || 'Ошибка очистки'
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
      <RouterLink to="/" class="admin__home">← На главную</RouterLink>

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
            <h1 class="admin__title">Заявки</h1>
            <p class="admin__meta">Записей: {{ sortedRows.length }} · MySQL через API</p>
            <p v-if="listError" class="field__error">{{ listError }}</p>
          </div>
          <div class="admin__actions">
            <button type="button" class="btn btn--ghost" @click="refresh">Обновить</button>
            <button type="button" class="btn btn--ghost" @click="exportExcel">Экспорт Excel</button>
            <button type="button" class="btn btn--danger" @click="clearAll">Очистить</button>
          </div>
        </header>

        <div v-if="sortedRows.length === 0" class="card card--empty">
          Пока нет завершённых регистраций. Похоже, единственный, кто попался на эту фишинговую форму, —
          вы сами, когда проверяли, что всё «просто работает».
        </div>

        <div v-else class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Время (UTC в данных)</th>
                <th>Имя</th>
                <th>E-mail</th>
                <th>Сценарий</th>
                <th>IP</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <template v-for="row in sortedRows" :key="rowKey(row)">
                <tr class="table__row" @click="toggleExpand(rowKey(row))">
                  <td>{{ formatWhen(row.submittedAt) }}</td>
                  <td>{{ row.fullName || '—' }}</td>
                  <td class="table__mono">{{ row.email || '—' }}</td>
                  <td>{{ flowLabel(row.flow) }}</td>
                  <td class="table__mono">{{ row.telemetry?.ip || '—' }}</td>
                  <td class="table__toggle">{{ expandedId === rowKey(row) ? '▼' : '▶' }}</td>
                </tr>
                <tr
                  v-if="expandedId === rowKey(row)"
                  class="table__detail"
                >
                  <td colspan="6">
                    <div class="detail">
                      <section v-if="row.raffleNumber" class="detail__block">
                        <h3 class="detail__h">Розыгрыш</h3>
                        <p>Номер: <strong>{{ row.raffleNumber }}</strong></p>
                        <p>Главный приз: {{ row.mainPrizeOptIn ? 'да' : 'нет' }}</p>
                        <p v-if="row.quizCategoryLabel">Категория викторины: {{ row.quizCategoryLabel }}</p>
                      </section>
                      <section class="detail__block">
                        <h3 class="detail__h">Технические данные</h3>
                        <dl class="detail__dl">
                          <dt>IP</dt>
                          <dd>{{ row.telemetry?.ip || '—' }}</dd>
                          <dt>Время отправки (ISO)</dt>
                          <dd class="detail__mono">{{ row.submittedAt }}</dd>
                          <dt>User-Agent</dt>
                          <dd class="detail__mono">{{ row.telemetry?.userAgent || '—' }}</dd>
                          <dt>Язык</dt>
                          <dd>{{ row.telemetry?.language }} {{ row.telemetry?.languages?.length ? `(${row.telemetry.languages.join(', ')})` : '' }}</dd>
                          <dt>Платформа</dt>
                          <dd>{{ row.telemetry?.platform || '—' }}</dd>
                          <dt>Экран</dt>
                          <dd>{{ row.telemetry?.screen || '—' }}</dd>
                          <dt>Окно</dt>
                          <dd>{{ row.telemetry?.viewport || '—' }}</dd>
                          <dt>Часовой пояс</dt>
                          <dd>{{ row.telemetry?.timezone || '—' }}</dd>
                          <dt>Referrer</dt>
                          <dd class="detail__mono">{{ row.telemetry?.referrer || '—' }}</dd>
                        </dl>
                      </section>
                      <section v-if="row.victorina?.length" class="detail__block">
                        <h3 class="detail__h">Ответы викторины</h3>
                        <ol class="detail__ol">
                          <li v-for="(v, i) in row.victorina" :key="i" class="detail__qa">
                            <p class="detail__q">{{ v.question }}</p>
                            <p class="detail__a">
                              <span class="detail__badge">{{ v.answerValue }}</span>
                              {{ v.answerLabel }}
                            </p>
                          </li>
                        </ol>
                      </section>
                      <section v-else-if="row.flow === 'declined_main_prize'" class="detail__block">
                        <p class="detail__muted">Викторина не заполнялась (ранний выход из сценария).</p>
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
  margin-bottom: 20px;
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
