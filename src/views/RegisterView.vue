<script setup>
import { reactive, ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { submitRegistration } from '../lib/apiRegistration'
import { buildTelemetry } from '../lib/clientMeta'
import { getOrCreateParticipantId } from '../lib/participantId'
import {
  logRegisterQuizPreparing,
  logRegisterQuizReady,
  logRegisterTransition,
  logSessionEvent,
} from '../lib/sessionEvents'

const router = useRouter()

/** Фон страницы — кадр из бывшей карусели главной (apartment). */
const REGISTER_BG_IMAGE = '/images/hero/apartment.png'

const TOTAL_STEPS = 4

const step = ref(0)

const form = reactive({
  fullName: '',
  email: '',
  /** Для записи в API: блок опроса (категория). */
  quizCategory: 'infosec',
})

const quizAnswers = reactive({
  q1: '',
})

const errors = reactive({
  fullName: '',
  email: '',
  quizQ1: '',
})

const submitting = ref(false)
const submitError = ref('')

const mainPrizeOptIn = ref(false)

/** Единственный вопрос шага 4 (знание регламентов / документации). */
const STEP4_QUESTION = {
  id: 'reg-doc-link-1',
  text: 'Информационная безопасность. Что обязательно проверять перед переходом по ссылке в письме?',
  options: [
    { value: 'a', text: 'a) Только тему письма' },
    {
      value: 'b',
      text: 'b) Адрес отправителя, так как он может быть подделан, проверяйте ссылку тщательно',
    },
    { value: 'c', text: 'c) Ничего, если письмо выглядит убедительно' },
    { value: 'd', text: 'd) Только подпись' },
  ],
}

const step3Loading = ref(false)
const sessionQ1 = ref(null)
let genTimeoutId = null

function getStep4Question() {
  return {
    id: STEP4_QUESTION.id,
    text: STEP4_QUESTION.text,
    options: STEP4_QUESTION.options.map((o) => ({ ...o })),
  }
}

function clearGenerationTimer() {
  if (genTimeoutId != null) {
    clearTimeout(genTimeoutId)
    genTimeoutId = null
  }
}

function beginStep3QuestionGeneration() {
  clearGenerationTimer()
  sessionQ1.value = null
  quizAnswers.q1 = ''
  step3Loading.value = true
  void logRegisterQuizPreparing()
  const ms = 850
  genTimeoutId = setTimeout(() => {
    genTimeoutId = null
    sessionQ1.value = getStep4Question()
    form.quizCategory = 'infosec'
    step3Loading.value = false
    void logRegisterQuizReady()
  }, ms)
}

const stepLabel = computed(() => {
  if (step.value === 3 && step3Loading.value) {
    return 'Подготовка вопроса…'
  }
  if (step.value === 3 && !step3Loading.value) {
    return `Шаг 4 из ${TOTAL_STEPS} · вопрос`
  }
  return `Шаг ${step.value + 1} из ${TOTAL_STEPS}`
})

watch(
  step,
  () => {
    submitError.value = ''
  },
)

onMounted(() => {
  void logSessionEvent({
    kind: 'register_landing',
    label: 'Открытие страницы регистрации (сценарий)',
    path: `${window.location.pathname}${window.location.search || ''}`.slice(0, 768),
  })
})

onUnmounted(() => {
  clearGenerationTimer()
})

function progressDotActive(idx) {
  return idx <= step.value
}

function progressDotCurrent(idx) {
  return idx === step.value
}

function clearErrorsForStep(i) {
  if (i === 0) errors.fullName = ''
  if (i === 1) errors.email = ''
  if (i === 3) errors.quizQ1 = ''
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
    if (step3Loading.value) {
      errors.quizQ1 = 'Подождите, идёт подбор вопроса…'
      return false
    }
    if (!sessionQ1.value) {
      errors.quizQ1 = 'Вопрос ещё не готов — попробуйте снова через секунду'
      return false
    }
    if (!quizAnswers.q1) {
      errors.quizQ1 = 'Выберите один вариант ответа'
      return false
    }
    return true
  }

  return true
}

function onFormSubmit() {
  if (step.value === 3 && step3Loading.value) return
  goNext()
}

function goNext() {
  if (step.value === 3 && step3Loading.value) return
  if (!validateStep(step.value)) return

  if (step.value === 2) {
    void logRegisterTransition(
      2,
      3,
      { agreedSurvey: 'Переход к вопросу викторины' },
      'Подтверждение и переход к вопросу',
    )
    acceptPhishingSurvey()
    return
  }

  if (step.value === 3) {
    const q = sessionQ1.value
    const o1 = q?.options?.find((o) => o.value === quizAnswers.q1)
    void logRegisterTransition(
      3,
      null,
      {
        quizAnswer: quizAnswers.q1,
        quizLabel: o1?.text ? String(o1.text).slice(0, 200) : '',
        quizQuestionId: q?.id || '',
      },
      'Ответ на викторину → отправка',
    )
    onSubmit()
    return
  }

  if (step.value < TOTAL_STEPS - 1) {
    if (step.value === 0) {
      void logRegisterTransition(0, 1, { fullName: form.fullName.trim() }, 'Имя → следующий шаг')
    }
    if (step.value === 1) {
      void logRegisterTransition(1, 2, { email: form.email.trim() }, 'E-mail → следующий шаг')
    }
    step.value += 1
  } else {
    onSubmit()
  }
}

function goBack() {
  if (step.value > 0) {
    submitError.value = ''
    const nextStep = step.value - 1
    if (step.value === 3 && nextStep === 2) {
      mainPrizeOptIn.value = false
      clearGenerationTimer()
      step3Loading.value = false
      sessionQ1.value = null
      quizAnswers.q1 = ''
      form.quizCategory = 'infosec'
    }
    step.value = nextStep
    clearErrorsForStep(step.value)
  }
}

function acceptPhishingSurvey() {
  mainPrizeOptIn.value = true
  step.value = 3
  beginStep3QuestionGeneration()
}

function buildVictorinaPayload() {
  const q1 = sessionQ1.value
  if (!q1) return []

  const o1 = q1.options.find((o) => o.value === quizAnswers.q1)

  return [
    {
      questionId: q1.id,
      question: q1.text,
      answerValue: quizAnswers.q1,
      answerLabel: o1?.text ?? quizAnswers.q1,
    },
  ]
}

async function onSubmit() {
  if (!mainPrizeOptIn.value) {
    step.value = 2
    return
  }

  if (!validateStep(3)) {
    step.value = 3
    return
  }

  for (const i of [0, 1, 3]) {
    if (!validateStep(i)) {
      step.value = i
      return
    }
  }

  submitting.value = true

  try {
    await logSessionEvent({
      kind: 'register_submit',
      label: 'Отправка заявки',
      path: `${window.location.pathname}${window.location.search || ''}`.slice(0, 768),
    })

    const telemetry = await buildTelemetry()

    const record = {
      id: getOrCreateParticipantId(),
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      quizCategory: form.quizCategory,
      quizCategoryLabel:
        form.quizCategory === 'company'
          ? 'Общие знания о компании'
          : form.quizCategory === 'infosec'
            ? 'Информационная безопасность'
            : form.quizCategory,
      mainPrizeOptIn: true,
      flow: 'full_registration',
      victorina: buildVictorinaPayload(),
      submittedAt: new Date().toISOString(),
      telemetry,
    }

    if (!record.victorina?.length) {
      throw new Error('Нет ответа на вопрос — выберите вариант и нажмите «Завершить» ещё раз.')
    }

    await submitRegistration(record)
    await router.replace({ name: 'register-complete' })
  } catch (e) {
    console.error(e)
    submitError.value =
      e instanceof Error ? e.message : 'Не удалось отправить заявку. Попробуйте ещё раз.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="register">
    <div
      class="register__bg"
      :style="{ backgroundImage: `url(${REGISTER_BG_IMAGE})` }"
      aria-hidden="true"
    />
    <div class="register__overlay" aria-hidden="true" />

    <div class="register__wrap">
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="register-dialog-title">
        <p class="dialog__eyebrow">Корпоративный розыгрыш</p>
        <p class="dialog__step-meta" aria-live="polite">{{ stepLabel }}</p>

        <div class="dialog__progress" aria-hidden="true">
          <span
            v-for="i in TOTAL_STEPS"
            :key="i"
            class="dialog__dot"
            :class="{
              'dialog__dot--active': progressDotActive(i - 1),
              'dialog__dot--current': progressDotCurrent(i - 1),
            }"
          />
        </div>

        <form class="dialog__form" novalidate @submit.prevent="onFormSubmit">
          <div v-show="step === 0" class="dialog__pane">
            <h1 id="register-dialog-title" class="dialog__title">Как к вам обращаться?</h1>
            <label class="field">
              <span class="field__label field__label--sentence">введите имя</span>
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

            <p class="dialog__hint">
              На этот адрес придёт подтверждение участия и напоминание перед эфиром. Укажите корпоративный ящик, если
              пользуетесь им.
            </p>
            <label class="field">
              <span class="field__label">E-mail</span>
              <input v-model="form.email" type="email" class="field__input" autocomplete="email" />
              <span v-if="errors.email" class="field__error">{{ errors.email }}</span>
            </label>
          </div>

          <div v-show="step === 2" class="dialog__pane">
            <h2 class="dialog__title">Вопрос на знание регламентов компании</h2>
            <p class="dialog__hint dialog__hint--tight">
              Случайным образом вам будет задан вопрос на знание документации. Пожалуйста, отвечайте внимательно.
            </p>
          </div>

          <div v-show="step === 3" class="dialog__pane">
            <template v-if="step3Loading">
              <h2 class="dialog__title">Генерация вопроса</h2>
              <p class="dialog__hint">Вопрос готовится — обычно меньше секунды.</p>
              <div class="fake-gen" aria-live="polite" aria-busy="true">
                <div class="fake-gen__spinner" />
                <!--
                <ul class="fake-gen__lines" aria-hidden="true">
                  <li>Анализ параметров сессии…</li>
                  <li>Выбор модуля «Фишинг и социальная инженерия»…</li>
                  <li>Формирование вариантов ответа…</li>
                </ul>
                -->
              </div>
            </template>
            <template v-else>
              <h2 class="dialog__title">Вопрос</h2>
              <p class="dialog__hint dialog__hint--quiz">Выберите один вариант ответа</p>
              <div v-if="sessionQ1" class="victorina-q" role="radiogroup" :aria-labelledby="'vq1-' + sessionQ1.id">
                <p :id="'vq1-' + sessionQ1.id" class="victorina-q__text">{{ sessionQ1.text }}</p>
                <div class="victorina-q__options">
                  <label
                    v-for="opt in sessionQ1.options"
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
            </template>
          </div>

          <p v-if="submitError" class="field__error dialog__submit-error" role="alert">{{ submitError }}</p>

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
              v-if="step < TOTAL_STEPS - 1"
              type="submit"
              class="dialog__btn dialog__btn--primary"
              :disabled="submitting || (step === 3 && step3Loading)"
            >
              Далее
            </button>
            <button
              v-else-if="step === TOTAL_STEPS - 1"
              type="submit"
              class="dialog__btn dialog__btn--primary"
              :disabled="submitting || step3Loading"
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
  position: relative;
  padding: 32px 20px 72px;
  min-height: calc(100dvh - var(--header-height));
  overflow: hidden;
  background: var(--blue-dark);
}

.register__bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-size: cover;
  background-position: center;
  transform: scale(1.03);
}

.register__overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    120deg,
    rgba(10, 22, 47, 0.78) 0%,
    rgba(10, 22, 47, 0.52) 45%,
    rgba(10, 22, 47, 0.68) 100%
  );
}

.register__wrap {
  position: relative;
  z-index: 2;
  max-width: 520px;
  margin: 0 auto;
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

.fake-gen {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 24px 12px 8px;
}

.fake-gen__spinner {
  width: 44px;
  height: 44px;
  border: 3px solid #e0e4ef;
  border-top-color: var(--blue-default);
  border-radius: 50%;
  animation: fake-gen-spin 0.85s linear infinite;
}

@keyframes fake-gen-spin {
  to {
    transform: rotate(360deg);
  }
}

.fake-gen__lines {
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
  max-width: 340px;
  font-size: 13px;
  line-height: 1.5;
  color: #6c6c6c;
}

.fake-gen__lines li {
  padding: 6px 0;
  border-bottom: 1px solid #eee;
}

.fake-gen__lines li:last-child {
  border-bottom: none;
}

.victorina-q {
  margin: 0;
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

.field__label--sentence {
  text-transform: none;
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

.dialog__submit-error {
  margin: 16px 0 0;
  padding: 12px 14px;
  background: #fff5f5;
  border-left: 3px solid var(--system-red);
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
