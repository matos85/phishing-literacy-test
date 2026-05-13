<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { logSessionEvent } from '../lib/sessionEvents'

const route = useRoute()

const isReturning = computed(() => route.query.returning === '1')

const completeTitle = computed(() =>
  isReturning.value ? 'Вы уже регистрировались' : 'Регистрация принята',
)

const completeText = computed(() =>
  isReturning.value
    ? 'С этого браузера заявка уже была отправлена ранее. Повторная регистрация не требуется. Итоги розыгрыша — на указанный при участии рабочий e-mail.'
    : 'Спасибо за участие. Итоги будут отправлены на указанный рабочий e-mail.',
)

/** Тот же кадр, что и на шагах регистрации (`RegisterView.vue`). */
const REGISTER_BG_IMAGE = '/images/hero/apartment.png'

const DTEL_HOME = 'https://dtel.ru/'

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
      <div class="complete__card">
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
  max-width: 480px;
  margin: 0 auto;
  text-align: center;
  padding: 48px 40px;
  background: #fff;
  border: 1px solid #e0e0e2;
  box-shadow: 0 12px 40px rgba(10, 22, 47, 0.08);
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

.complete__text,
.complete__hint {
  font-size: 15px;
  line-height: 1.55;
  color: #3b3b3b;
  margin: 0 0 12px;
}

.complete__hint {
  font-size: 14px;
  color: #6c6c6c;
  margin-bottom: 28px;
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
