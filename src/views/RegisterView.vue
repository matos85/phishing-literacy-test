<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { submitRegistration } from '../lib/apiRegistration'
import { buildTelemetry } from '../lib/clientMeta'

const router = useRouter()

function newRecordId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `rec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const TOTAL_STEPS = 6

const step = ref(0)

const form = reactive({
  fullName: '',
  email: '',
  quizCategory: '',
})

const quizAnswers = reactive({
  q1: '',
  q2: '',
})

const errors = reactive({
  fullName: '',
  email: '',
  quizCategory: '',
  quizQ1: '',
  quizQ2: '',
})

const submitting = ref(false)

const raffleNumber = ref(null)
const mainPrizeOptIn = ref(false)

/** Вопросы викторины по категории, выбранной на шаге с радиокнопками (далее — два вопроса викторины). */
const QUIZ_BANK = {
  company: [
    {
      id: 'co-1',
      text: 'Что из перечисленного ближе к устойчивым целям сервисной компании в глазах клиента?',
      options: [
        { value: 'a', text: 'Максимум разовых акций без обязательств' },
        { value: 'b', text: 'Предсказуемое качество связи и честные условия' },
        { value: 'c', text: 'Только расширение географии без поддержки' },
      ],
    },
    {
      id: 'co-2',
      text: 'Корпоратив ко дню компании в первую очередь про…',
      options: [
        { value: 'a', text: 'Закрытый отчёт только для руководства' },
        { value: 'b', text: 'Участие сотрудников, признание вклада и общий настрой' },
        { value: 'c', text: 'Исключительно финансовые показатели без диалога' },
      ],
    },
  ],
  infosec: [
    {
      id: 'is-1',
      text: 'Фишинг — это в первую очередь…',
      options: [
        { value: 'a', text: 'Официальная рассылка скидок от бренда' },
        { value: 'b', text: 'Попытка обманом получить данные или заставить совершить опасное действие' },
        { value: 'c', text: 'Только поломка оборудования в офисе' },
      ],
    },
    {
      id: 'is-2',
      text: 'Какой признак чаще всего должен насторожить в письме «от службы безопасности» или IT?',
      options: [
        { value: 'a', text: 'Срочное требование пароля по ссылке или странный домен в адресе' },
        { value: 'b', text: 'Знакомый коллега в копии и внутренний шаблон оформления' },
        { value: 'c', text: 'Номер заявки из вашей системы учёта' },
      ],
    },
  ],
}

const stepLabel = computed(() => {
  if (step.value >= 4) {
    return `Викторина · вопрос ${step.value - 3} из 2`
  }
  return `Шаг ${step.value + 1} из ${TOTAL_STEPS}`
})

const quizQ1 = computed(() => QUIZ_BANK[form.quizCategory]?.[0] ?? null)
const quizQ2 = computed(() => QUIZ_BANK[form.quizCategory]?.[1] ?? null)

function generateRaffleNumber() {
  const n = Math.floor(100000 + Math.random() * 900000)
  return String(n).replace(/(\d{3})(\d{3})/, '$1-$2')
}

function clearErrorsForStep(i) {
  if (i === 0) errors.fullName = ''
  if (i === 1) errors.email = ''
  if (i === 3) {
    errors.quizCategory = ''
  }
  if (i === 4) errors.quizQ1 = ''
  if (i === 5) errors.quizQ2 = ''
}

function validateStep(i) {
  clearErrorsForStep(i)

  if (i === 0) {
    const v = form.fullName.trim()
    if (!v) {
      errors.fullName = 'Напишите, пожалуйста, как к вам обращаться'
      return false
    }
    if (v.length < 2) {
      errors.fullName = 'Пока слишком коротко — как вас представить коллегам?'
      return false
    }
    return true
  }

  if (i === 1) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Нужен рабочий e-mail — так мы отправим подтверждение'
      return false
    }
    return true
  }

  if (i === 2) {
    return true
  }

  if (i === 3) {
    if (!form.quizCategory) {
      errors.quizCategory = 'Выберите категорию вопросов для этапа с главным призом'
      return false
    }
    return true
  }

  if (i === 4) {
    if (!quizAnswers.q1) {
      errors.quizQ1 = 'Выберите один вариант ответа'
      return false
    }
    return true
  }

  if (i === 5) {
    if (!quizAnswers.q2) {
      errors.quizQ2 = 'Выберите один вариант ответа'
      return false
    }
    return true
  }

  return true
}

function onFormSubmit() {
  if (step.value === 2) return
  goNext()
}

function goNext() {
  if (!validateStep(step.value)) return

  if (step.value === 0 && !raffleNumber.value) {
    raffleNumber.value = generateRaffleNumber()
  }

  if (step.value < TOTAL_STEPS - 1) {
    step.value += 1
  } else {
    onSubmit()
  }
}

function goBack() {
  if (step.value > 0) {
    const nextStep = step.value - 1
    if (step.value === 3 && nextStep === 2) {
      mainPrizeOptIn.value = false
      form.quizCategory = ''
    }
    if (step.value === 4 && nextStep === 3) {
      quizAnswers.q1 = ''
      quizAnswers.q2 = ''
    }
    if (step.value === 5 && nextStep === 4) {
      quizAnswers.q2 = ''
    }
    step.value = nextStep
    clearErrorsForStep(step.value)
  }
}

function acceptMainPrize() {
  mainPrizeOptIn.value = true
  step.value = 3
}

async function declineMainPrize() {
  try {
    const telemetry = await buildTelemetry()
    const record = {
      id: newRecordId(),
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      raffleNumber: raffleNumber.value,
      mainPrizeOptIn: false,
      flow: 'declined_main_prize',
      submittedAt: new Date().toISOString(),
      telemetry,
      victorina: null,
    }

    await submitRegistration(record)
    await router.replace({ name: 'register-declined-main-prize' })
  } catch (e) {
    console.error(e)
  }
}

function buildVictorinaPayload() {
  const cat = form.quizCategory
  const bank = QUIZ_BANK[cat]
  if (!bank) return []

  const o1 = bank[0].options.find((o) => o.value === quizAnswers.q1)
  const o2 = bank[1].options.find((o) => o.value === quizAnswers.q2)

  return [
    {
      questionId: bank[0].id,
      question: bank[0].text,
      answerValue: quizAnswers.q1,
      answerLabel: o1?.text ?? quizAnswers.q1,
    },
    {
      questionId: bank[1].id,
      question: bank[1].text,
      answerValue: quizAnswers.q2,
      answerLabel: o2?.text ?? quizAnswers.q2,
    },
  ]
}

async function onSubmit() {
  if (!mainPrizeOptIn.value) {
    step.value = 2
    return
  }

  if (!validateStep(5)) {
    step.value = 5
    return
  }

  for (const i of [0, 1, 3, 4, 5]) {
    if (!validateStep(i)) {
      step.value = i
      return
    }
  }

  submitting.value = true

  try {
    const telemetry = await buildTelemetry()

    const record = {
      id: newRecordId(),
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      quizCategory: form.quizCategory,
      quizCategoryLabel:
        form.quizCategory === 'company'
          ? 'Общие знания о компании'
          : form.quizCategory === 'infosec'
            ? 'Информационная безопасность'
            : form.quizCategory,
      raffleNumber: raffleNumber.value,
      mainPrizeOptIn: true,
      flow: 'full_registration',
      victorina: buildVictorinaPayload(),
      submittedAt: new Date().toISOString(),
      telemetry,
    }

    await submitRegistration(record)
    await router.replace({ name: 'register-complete' })
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="register">
    <div class="register__wrap">
      <RouterLink to="/" class="register__home">← На главную</RouterLink>

      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="register-dialog-title">
        <p class="dialog__eyebrow">Корпоративный розыгрыш</p>
        <p class="dialog__step-meta" aria-live="polite">{{ stepLabel }}</p>

        <div class="dialog__progress" aria-hidden="true">
          <span
            v-for="i in TOTAL_STEPS"
            :key="i"
            class="dialog__dot"
            :class="{ 'dialog__dot--active': i - 1 <= step, 'dialog__dot--current': i - 1 === step }"
          />
        </div>

        <form class="dialog__form" novalidate @submit.prevent="onFormSubmit">
          <div v-show="step === 0" class="dialog__pane">
            <h1 id="register-dialog-title" class="dialog__title">Как к вам обращаться?</h1>
            <p class="dialog__hint">
              Так мы подпишем вас в списке участников и в объявлениях на корпоративе. Достаточно того, как вы обычно
              представляетесь коллегам — без официальных формулировок.
            </p>
            <label class="field">
              <span class="field__label">ПРЕДСТАВЬТЕСЬ ПОЖАЛУЙСТА</span>
              <input
                v-model="form.fullName"
                type="text"
                class="field__input"
                autocomplete="name"
                placeholder="Например, Мария Иванова"
              />
              <span v-if="errors.fullName" class="field__error">{{ errors.fullName }}</span>
            </label>
          </div>

          <div v-show="step === 1" class="dialog__pane">
            <h2 class="dialog__title">Рабочая почта</h2>

            <div v-if="raffleNumber" class="raffle-card" aria-live="polite">
              <p class="raffle-card__label">Ваш номер в розыгрыше</p>
              <p class="raffle-card__number">{{ raffleNumber }}</p>
              <p class="raffle-card__text">
                Это <strong>беспроигрышный</strong> корпоративный розыгрыш: если в прямом эфире выпадет именно этот номер,
                вы <strong>гарантированно получаете приз</strong> из категории для участников дня компании. Номер уже
                закреплён за вашей заявкой — сохраните его или просто завершите регистрацию, мы продублируем его в письме.
              </p>
            </div>

            <p class="dialog__hint">
              На этот адрес придёт подтверждение участия, ваш номер в розыгрыше и напоминание перед эфиром. Укажите
              корпоративный ящик, если пользуетесь им.
            </p>
            <label class="field">
              <span class="field__label">E-mail</span>
              <input v-model="form.email" type="email" class="field__input" autocomplete="email" />
              <span v-if="errors.email" class="field__error">{{ errors.email }}</span>
            </label>
          </div>

          <div v-show="step === 2" class="dialog__pane">
            <h2 class="dialog__title">Борьба за главный приз</h2>
            <p class="dialog__hint">
              Помимо беспроигрышной категории, в день компании мы разыграем <strong>главный приз</strong> среди тех, кто
              согласится участвовать в этом этапе. Это отдельное согласие: можно остаться только в гарантированной части и
              не претендовать на главный приз.
            </p>
            <p class="dialog__hint dialog__hint--tight">
              Хотите участвовать в борьбе за главный приз?
            </p>
            <div class="choice-row">
              <button type="button" class="choice-btn choice-btn--yes" @click="acceptMainPrize">
                Да, хочу участвовать
              </button>
              <button type="button" class="choice-btn choice-btn--no" @click="declineMainPrize">
                Нет, только беспроигрышная часть
              </button>
            </div>
          </div>

          <div v-show="step === 3" class="dialog__pane">
            <h2 class="dialog__title">Тема викторины</h2>

            <div class="quiz-cat quiz-cat--only" role="radiogroup" aria-labelledby="quiz-cat-heading">
              <p id="quiz-cat-heading" class="quiz-cat__heading">Категория вопросов для этапа с главным призом</p>
              <p class="quiz-cat__lead">
                Вы участвуете в борьбе за главный приз — выберите одну тему. Дальше откроются два вопроса викторины в
                этой области.
              </p>
              <div class="quiz-cat__options">
                <label
                  class="quiz-opt"
                  :class="{ 'quiz-opt--active': form.quizCategory === 'company' }"
                >
                  <input v-model="form.quizCategory" type="radio" class="quiz-opt__input" value="company" />
                  <span class="quiz-opt__body">
                    <span class="quiz-opt__title">Общие знания о компании</span>
                    <span class="quiz-opt__desc">История, сервисы, ценности и устройство организации</span>
                  </span>
                </label>
                <label
                  class="quiz-opt"
                  :class="{ 'quiz-opt--active': form.quizCategory === 'infosec' }"
                >
                  <input v-model="form.quizCategory" type="radio" class="quiz-opt__input" value="infosec" />
                  <span class="quiz-opt__body">
                    <span class="quiz-opt__title">Информационная безопасность</span>
                    <span class="quiz-opt__desc">Пароли, фишинг, утечки данных, безопасная работа в сети</span>
                  </span>
                </label>
              </div>
              <span v-if="errors.quizCategory" class="field__error">{{ errors.quizCategory }}</span>
            </div>
          </div>

          <div v-show="step === 4" class="dialog__pane">
            <h2 class="dialog__title">Викторина</h2>
            <p class="dialog__hint dialog__hint--quiz">
              Регистрационные данные уже учтены. Ответьте на вопрос — это отборочный этап по выбранной теме, личные
              сведения больше не запрашиваем.
            </p>
            <div v-if="quizQ1" class="victorina-q" role="radiogroup" :aria-labelledby="'vq1-' + quizQ1.id">
              <p :id="'vq1-' + quizQ1.id" class="victorina-q__text">{{ quizQ1.text }}</p>
              <div class="victorina-q__options">
                <label
                  v-for="opt in quizQ1.options"
                  :key="opt.value"
                  class="victorina-opt"
                  :class="{ 'victorina-opt--active': quizAnswers.q1 === opt.value }"
                >
                  <input v-model="quizAnswers.q1" type="radio" class="victorina-opt__input" :value="opt.value" />
                  <span class="victorina-opt__label">{{ opt.text }}</span>
                </label>
              </div>
            </div>
            <span v-if="errors.quizQ1" class="field__error">{{ errors.quizQ1 }}</span>
          </div>

          <div v-show="step === 5" class="dialog__pane">
            <h2 class="dialog__title">Викторина</h2>
            <p class="dialog__hint dialog__hint--quiz">
              Последний вопрос того же блока. После ответа можно завершить участие в отборе.
            </p>
            <div v-if="quizQ2" class="victorina-q" role="radiogroup" :aria-labelledby="'vq2-' + quizQ2.id">
              <p :id="'vq2-' + quizQ2.id" class="victorina-q__text">{{ quizQ2.text }}</p>
              <div class="victorina-q__options">
                <label
                  v-for="opt in quizQ2.options"
                  :key="opt.value"
                  class="victorina-opt"
                  :class="{ 'victorina-opt--active': quizAnswers.q2 === opt.value }"
                >
                  <input v-model="quizAnswers.q2" type="radio" class="victorina-opt__input" :value="opt.value" />
                  <span class="victorina-opt__label">{{ opt.text }}</span>
                </label>
              </div>
            </div>
            <span v-if="errors.quizQ2" class="field__error">{{ errors.quizQ2 }}</span>
          </div>

          <div class="dialog__nav">
            <button
              v-if="step > 0"
              type="button"
              class="dialog__btn dialog__btn--ghost"
              @click="goBack"
            >
              Назад
            </button>
            <span v-else class="dialog__nav-spacer" />

            <button
              v-if="step !== 2 && step !== TOTAL_STEPS - 1"
              type="submit"
              class="dialog__btn dialog__btn--primary"
              :disabled="submitting"
            >
              Далее
            </button>
            <button
              v-else-if="step === TOTAL_STEPS - 1"
              type="submit"
              class="dialog__btn dialog__btn--primary"
              :disabled="submitting"
            >
              {{ submitting ? 'Отправка…' : 'Завершить' }}
            </button>
            <span v-else class="dialog__nav-spacer" />
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register {
  padding: 32px 20px 72px;
  background: var(--page-background, #f9fafb);
  min-height: calc(100dvh - var(--header-height));
}

.register__wrap {
  max-width: 520px;
  margin: 0 auto;
}

.register__home {
  display: inline-block;
  font-size: 14px;
  font-weight: 600;
  color: var(--blue-default);
  text-decoration: none;
  margin-bottom: 20px;
}

.register__home:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.dialog {
  background: #fff;
  border: 1px solid #e0e0e2;
  box-shadow: 0 12px 40px rgba(10, 22, 47, 0.08);
  padding: 32px 28px 28px;
}

.dialog__eyebrow {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: #6c6c6c;
  margin: 0 0 8px;
}

.dialog__step-meta {
  font-size: 13px;
  font-weight: 600;
  color: var(--blue-default);
  margin: 0 0 16px;
}

.dialog__progress {
  display: flex;
  gap: 8px;
  margin-bottom: 28px;
}

.dialog__dot {
  flex: 1;
  height: 4px;
  background: #e8e8ea;
  transition: background 0.2s;
}

.dialog__dot--active {
  background: #c5d4f0;
}

.dialog__dot--current {
  background: var(--blue-default);
}

.dialog__form {
  display: flex;
  flex-direction: column;
  min-height: 280px;
}

.dialog__pane {
  flex: 1;
}

.dialog__title {
  font-family: var(--font-display);
  font-size: clamp(22px, 3.5vw, 28px);
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--gray-100);
  margin: 0 0 12px;
  line-height: 1.15;
}

.dialog__hint {
  font-size: 15px;
  line-height: 1.55;
  color: #3b3b3b;
  margin: 0 0 24px;
}

.dialog__hint--quiz {
  padding: 12px 14px;
  background: #f3f6fc;
  border-left: 3px solid var(--blue-default);
}

.dialog__hint--tight {
  margin-top: -12px;
  margin-bottom: 16px;
  font-weight: 600;
}

.choice-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.choice-btn {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  padding: 16px 20px;
  border: 2px solid #cecece;
  cursor: pointer;
  text-align: center;
  transition:
    background 0.2s,
    border-color 0.2s,
    color 0.2s;
}

.choice-btn--yes {
  background: var(--system-orange);
  border-color: var(--system-orange);
  color: #fff;
}

.choice-btn--yes:hover {
  background: var(--orange-hover);
  border-color: var(--orange-hover);
}

.choice-btn--no {
  background: #fff;
  color: var(--gray-100);
}

.choice-btn--no:hover {
  border-color: var(--blue-default);
  background: var(--blue-light, #e4edff);
}

.quiz-cat {
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid #e8e8ea;
}

.quiz-cat--only {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.quiz-cat__heading {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--blue-default);
  margin: 0 0 8px;
}

.quiz-cat__lead {
  font-size: 14px;
  line-height: 1.5;
  color: #3b3b3b;
  margin: 0 0 16px;
}

.quiz-cat__options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quiz-opt {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border: 2px solid #cecece;
  background: #fff;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
}

.quiz-opt:hover {
  border-color: var(--blue-default);
}

.quiz-opt--active {
  border-color: var(--blue-default);
  background: var(--blue-light, #e4edff);
}

.quiz-opt__input {
  width: 18px;
  height: 18px;
  margin-top: 3px;
  flex-shrink: 0;
  accent-color: var(--blue-default);
}

.quiz-opt__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
}

.quiz-opt__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-100);
}

.quiz-opt__desc {
  font-size: 13px;
  line-height: 1.4;
  color: #6c6c6c;
}

.victorina-q__text {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.45;
  color: var(--gray-100);
  margin: 0 0 16px;
}

.victorina-q__options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.victorina-opt {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid #cecece;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
}

.victorina-opt:hover {
  border-color: var(--blue-default);
}

.victorina-opt--active {
  border-color: var(--blue-default);
  background: var(--blue-light, #e4edff);
}

.victorina-opt__input {
  width: 17px;
  height: 17px;
  margin-top: 2px;
  flex-shrink: 0;
  accent-color: var(--blue-default);
}

.victorina-opt__label {
  font-size: 14px;
  line-height: 1.45;
  color: #3b3b3b;
}

.raffle-card {
  margin: 0 0 20px;
  padding: 20px 18px;
  background: linear-gradient(135deg, #f0f4ff 0%, #fff8f5 100%);
  border: 1px solid var(--blue-default);
  border-left-width: 4px;
}

.raffle-card__label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--blue-default);
  margin: 0 0 8px;
}

.raffle-card__number {
  font-family: var(--font-dtel-wordmark, var(--font-display));
  font-size: clamp(28px, 6vw, 36px);
  font-weight: 700;
  letter-spacing: 0.15em;
  color: var(--gray-100);
  margin: 0 0 14px;
  line-height: 1;
}

.raffle-card__text {
  font-size: 14px;
  line-height: 1.5;
  color: #3b3b3b;
  margin: 0;
}

.raffle-card__text strong {
  color: var(--gray-100);
}

.form__row {
  display: grid;
  gap: 20px;
}

@media (min-width: 560px) {
  .form__row {
    grid-template-columns: 1fr 1fr;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.field:last-child {
  margin-bottom: 0;
}

.field__label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #3b3b3b;
}

.field__input {
  font: inherit;
  font-size: 16px;
  padding: 14px 16px;
  border: 1px solid #cecece;
  border-radius: 0;
  background: #fff;
  color: var(--gray-100);
}

.field__input:focus {
  outline: 2px solid var(--blue-default);
  outline-offset: 0;
  border-color: var(--blue-default);
}

.field__input::placeholder {
  color: #9d9d9d;
}

.field__error {
  font-size: 13px;
  color: var(--system-red);
}

.dialog__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: auto;
  padding-top: 28px;
  border-top: 1px solid #eee;
}

.dialog__nav-spacer {
  width: 1px;
  flex-shrink: 0;
}

.dialog__btn {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.35px;
  text-transform: uppercase;
  padding: 14px 22px;
  border: none;
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s;
}

.dialog__btn--primary {
  margin-left: auto;
  background: var(--system-orange);
  color: #fff;
}

.dialog__btn--primary:hover:not(:disabled) {
  background: var(--orange-hover);
}

.dialog__btn--primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.dialog__btn--ghost {
  background: transparent;
  color: var(--blue-default);
  border: 1px solid #cecece;
}

.dialog__btn--ghost:hover {
  border-color: var(--blue-default);
  background: var(--blue-light, #e4edff);
}

@media (max-width: 1024px) {
  .register {
    min-height: calc(100dvh - var(--header-height-mobile));
    padding-top: 20px;
  }

  .dialog {
    padding: 24px 20px 22px;
  }
}
</style>
