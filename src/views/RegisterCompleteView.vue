<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchRegistrationStatus } from '../lib/apiRegistration'
import { getOrCreateParticipantId } from '../lib/participantId'
import { ensureRegistrationBackupFromServer } from '../lib/registrationBackup'
import { ensureMaxNotifyClientMark } from '../lib/maxNotifyClientMark'
import { logSessionEvent } from '../lib/sessionEvents'
import {
  logRegisterFlowComplete,
  logRegisterSiteLeave,
  consumeRegisterJustSubmitted,
} from '../lib/registerFlowLog'

const router = useRouter()

/** Показываем карточку только после проверки registered на сервере. */
const showComplete = ref(false)
/** true — повторный заход; false — только что отправили заявку (sessionStorage, не URL). */
const isReturning = ref(true)

const completeTitle = computed(() =>
  isReturning.value ? 'Вы уже регистрировались' : 'Регистрация принята',
)

const completeText = computed(() =>
  isReturning.value
    ? 'С этого браузера заявка уже была отправлена ранее. Повторная регистрация не требуется. Итоги розыгрыша — на указанный при участии рабочий e-mail.'
    : 'Спасибо за участие. Итоги будут отправлены на указанный рабочий e-mail.',
)

const REGISTER_BG_IMAGE = '/images/hero/apartment.png'
const DTEL_HOME = 'https://dtel.ru/'

function onPageHide() {
  const nav = typeof performance !== 'undefined' ? performance.getEntriesByType('navigation')[0] : null
  if (nav && nav.type === 'reload') return
  void logRegisterSiteLeave()
}

onMounted(async () => {
  const pid = getOrCreateParticipantId()
  try {
    const { registered, registration } = await fetchRegistrationStatus(pid)
    if (!registered) {
      await router.replace({ name: 'register' })
      return
    }
    ensureRegistrationBackupFromServer(pid, registration)
    ensureMaxNotifyClientMark(pid)
    isReturning.value = !consumeRegisterJustSubmitted()
    showComplete.value = true
    void logRegisterFlowComplete(isReturning.value)
    window.addEventListener('pagehide', onPageHide)
  } catch {
    await router.replace({ name: 'register' })
  }
})

onUnmounted(() => {
  window.removeEventListener('pagehide', onPageHide)
})

function onLeaveToDtel(e) {
  e.preventDefault()
  void logSessionEvent({
    kind: 'leave_to_public_home',
    label: 'Кнопка «На главную» (dtel.ru)',
    path: `${window.location.pathname}${window.location.search || ''}`.slice(0, 768),
    meta: { target: DTEL_HOME },
  })
  window.location.assign(DTEL_HOME)
}
</script>

<template>
  <div class="complete">
    <div
      class="complete__bg"
      :style="{ backgroundImage: `url(${REGISTER_BG_IMAGE})` }"
      aria-hidden="true"
    />
    <div class="complete__overlay" aria-hidden="true" />

    <div class="complete__wrap">
      <div v-if="!showComplete" class="complete__card" role="status" aria-live="polite">
        <p class="complete__text">Проверяем данные…</p>
      </div>
      <div v-else class="complete__card">
        <div class="complete__icon" aria-hidden="true">✓</div>
        <h1 class="complete__title">{{ completeTitle }}</h1>
        <p class="complete__text">
          {{ completeText }}
        </p>

        <a :href="DTEL_HOME" class="complete__btn" @click="onLeaveToDtel">На главную</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.complete {
  position: relative;
  min-height: calc(100dvh - var(--header-height));
  overflow: hidden;
  padding: 32px 20px 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--blue-dark);
}

.complete__bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-size: cover;
  background-position: center;
  transform: scale(1.03);
}

.complete__overlay {
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

.complete__wrap {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
}

.complete__card {
  background: #fff;
  border: 1px solid #e0e0e2;
  box-shadow: 0 12px 40px rgba(10, 22, 47, 0.08);
  padding: 48px 40px;
  text-align: center;
}

.complete__icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 20px;
  border-radius: 50%;
  background: var(--system-green, #82bb5d);
  color: #fff;
  font-size: 28px;
  line-height: 56px;
  font-weight: 700;
}

.complete__title {
  font-family: var(--font-display);
  font-size: clamp(22px, 3vw, 28px);
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--gray-100);
  margin: 0 0 16px;
  line-height: 1.2;
}

.complete__text {
  font-size: 15px;
  line-height: 1.55;
  color: #3b3b3b;
  margin: 0 0 28px;
}

.complete__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.35px;
  text-transform: uppercase;
  padding: 16px 32px;
  background: var(--blue-default);
  color: #fff;
  text-decoration: none;
  transition: background 0.2s;
}

.complete__btn:hover {
  background: var(--blue-hover);
}

@media (max-width: 1024px) {
  .complete {
    min-height: calc(100dvh - var(--header-height-mobile));
  }

  .complete__card {
    padding: 36px 24px;
  }
}
</style>
