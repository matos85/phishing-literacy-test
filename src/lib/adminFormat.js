/** Общее форматирование дат в админке (локаль ru-RU). */
export function formatAdminWhen(iso) {
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

export function registrationFlowLabel(flow) {
  if (flow === 'full_registration') return 'Регистрация + опрос (1 вопрос)'
  if (flow === 'declined_main_prize') return 'Без опроса (ранний выход)'
  return flow || '—'
}

/** Тип строки журнала session_events для таблицы «Хронология». */
export function sessionEventKindLabel(kind) {
  if (kind === 'register_page_first_open') return 'Первый вход / открытие'
  if (kind === 'register_step_next') return 'Переход по шагам'
  if (kind === 'register_field_input') return 'Данные введены / изменены'
  if (kind === 'register_step_back') return 'Переход назад'
  if (kind === 'register_flow_complete') return 'Регистрация завершена'
  if (kind === 'register_repeat_open') return 'Повторная попытка'
  if (kind === 'register_site_leave') return 'Выгрузка страницы'
  if (kind === 'route') return 'Страница'
  if (kind === 'leave_to_public_home') return 'Уход на dtel.ru'
  return kind || '—'
}

/** Подписи полей в meta событий хронологии (человекочитаемые ключи). */
export function formatStepDataMetaKey(key) {
  const map = {
    fullName: 'Имя',
    email: 'E-mail',
    fields: 'Поля',
    changes: 'Значения',
    fromStep: 'С шага',
    toStep: 'На шаг',
    returning: 'Повторная попытка',
    target: 'Куда',
  }
  return map[key] || key
}

/** Подпись ключа поля регистрации (в т.ч. для старых записей meta.fields). */
export function registerFieldIdToLabel(id) {
  if (id === 'fullName') return 'Имя'
  if (id === 'email') return 'E-mail'
  if (id === 'quizAnswer') return 'Ответ викторины'
  return String(id)
}

/**
 * Человекочитаемое значение meta в админке (массивы fields/changes, флаги).
 * @param {string} key
 * @param {unknown} value
 */
export function formatSessionEventMetaValue(key, value) {
  if (key === 'returning') return value === true || value === 1 ? 'да' : 'нет'
  if (key === 'fields' && Array.isArray(value)) {
    return value.map((id) => registerFieldIdToLabel(String(id))).join(', ')
  }
  if (key === 'changes' && Array.isArray(value)) {
    return value
      .map((c) => {
        if (c && typeof c === 'object' && 'label' in c && 'value' in c) {
          return `${String(c.label)}: ${String(c.value)}`
        }
        return JSON.stringify(c)
      })
      .join('\n')
  }
  if (value != null && typeof value === 'object') return JSON.stringify(value)
  return String(value ?? '')
}
