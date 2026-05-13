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
