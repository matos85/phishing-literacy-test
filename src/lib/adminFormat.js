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
  if (kind === 'route') return 'Страница'
  if (kind === 'register_step') return 'Шаг формы'
  if (kind === 'register_quiz_prepare') return 'Викторина · подготовка'
  if (kind === 'register_quiz_ready') return 'Викторина · вопрос'
  if (kind === 'register_submit') return 'Отправка заявки'
  if (kind === 'register_step_data') return 'Данные на шаге'
  if (kind === 'register_transition') return 'Переход формы'
  if (kind === 'register_landing') return 'Вход в регистрацию'
  if (kind === 'leave_to_public_home') return 'Уход на dtel.ru'
  return kind || '—'
}

/** Подписи полей в meta событий хронологии (человекочитаемые ключи). */
export function formatStepDataMetaKey(key) {
  const map = {
    fullName: 'Имя',
    email: 'E-mail',
    quizAnswer: 'Ответ (код)',
    quizLabel: 'Текст ответа',
    quizQuestionId: 'ID вопроса',
    agreedSurvey: 'Действие',
    next: 'Далее',
    target: 'Куда',
  }
  return map[key] || key
}
