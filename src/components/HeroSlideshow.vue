<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'

/** Фоны — те же файлы, что на dtel.ru в /images/backgrounds/ (картинка без текста, только сцена). */
const slides = [
  {
    eyebrow: 'Ко дню компании',
    title: 'Корпоративный розыгрыш только для сотрудников',
    subtitle:
      'Зарегистрируйтесь в списке участников и попадите в финальный розыгрыш: техника, сертификаты партнёров и приз от руководства. Победителей объявим на корпоративе.',
    ctaPrimary: 'Зарегистрироваться в розыгрыше',
    ctaSecondary: 'Как это работает',
    image: '/images/hero/apartment.png',
  },
  {
    eyebrow: 'Не упустите шанс',
    title: 'Места в розыгрыше заканчиваются — список закроется автоматически',
    subtitle:
      'Осталось подтвердить участие тем, кто ещё не успел. После закрытия регистрации добавить сотрудников вручную нельзя — система фиксирует состав для аудита.',
    ctaPrimary: 'Подтвердить участие сейчас',
    ctaSecondary: 'Сроки и правила',
    image: '/images/hero/business.png',
  },
  {
    eyebrow: 'Что разыгрываем',
    title: 'Призы, о которых давно мечтали коллеги из соседних отделов',
    subtitle:
      'Флагманские смартфоны, ноутбук для удалёнки, годовые подписки на сервисы и денежные компенсации от партнёров. Чем раньше регистрация — тем выше номер в очереди на суперприз.',
    ctaPrimary: 'Занять место в очереди',
    ctaSecondary: 'Полный список призов',
    image: '/images/hero/tv.png',
  },
  {
    eyebrow: 'Только свои',
    title: 'Проверьте корпоративную почту и завершите короткую анкету',
    subtitle:
      'Участвуют только действующие сотрудники с рабочим e-mail в домене компании. Нужны ФИО, отдел и табельный номер — так мы отсекаем случайных гостей и ботов.',
    ctaPrimary: 'Заполнить анкету участника',
    ctaSecondary: 'Пример анкеты',
    image: '/images/hero/house.png',
  },
  {
    eyebrow: 'Один шаг',
    title: 'Регистрация занимает меньше минуты — дальше ждите корпоратив',
    subtitle:
      'Введите табельный номер и рабочий адрес почты, придумайте пароль для личного кабинета розыгрыша и подтвердите номер телефона. Готово: вы в списке участников дня компании.',
    ctaPrimary: 'Начать регистрацию',
    ctaSecondary: 'Связаться с HR',
    image: '/images/hero/intercom.png',
  },
]

const current = ref(0)
const paused = ref(false)
let timer = null

const SLIDE_MS = 6500

function go(i) {
  current.value = (i + slides.length) % slides.length
  restartTimer()
}

function next() {
  go(current.value + 1)
}

function prev() {
  go(current.value - 1)
}

function restartTimer() {
  if (timer) clearInterval(timer)
  if (!paused.value) {
    timer = setInterval(next, SLIDE_MS)
  }
}

function onPause() {
  paused.value = true
  if (timer) clearInterval(timer)
}

function onResume() {
  paused.value = false
  restartTimer()
}

onMounted(() => {
  restartTimer()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <section
    class="hero"
    aria-roledescription="carousel"
    aria-label="Слайды главной страницы"
    @mouseenter="onPause"
    @mouseleave="onResume"
    @focusin="onPause"
    @focusout="onResume"
  >
    <div class="hero__slides">
      <div
        v-for="(s, i) in slides"
        :key="i"
        class="hero__slide"
        :class="{ 'hero__slide--active': i === current }"
        :aria-hidden="i !== current"
      >
        <div
          class="hero__bg"
          :style="{
            backgroundImage: `url(${s.image})`,
          }"
        />
        <div class="hero__content">
          <p class="hero__eyebrow">{{ s.eyebrow }}</p>
          <h1 class="hero__title">{{ s.title }}</h1>
          <p class="hero__subtitle">{{ s.subtitle }}</p>
          <div class="hero__cta">
            <RouterLink to="/register" class="hero__btn hero__btn--orange">{{ s.ctaPrimary }}</RouterLink>
            <RouterLink to="/register" class="hero__btn hero__btn--outline">{{ s.ctaSecondary }}</RouterLink>
          </div>
        </div>
      </div>
    </div>

    <div class="hero__controls">
      <button type="button" class="hero__arrow" aria-label="Предыдущий слайд" @click="prev">
        <span aria-hidden="true">‹</span>
      </button>
      <button type="button" class="hero__arrow" aria-label="Следующий слайд" @click="next">
        <span aria-hidden="true">›</span>
      </button>
    </div>

    <div class="hero__dots" role="tablist" aria-label="Выбор слайда">
      <button
        v-for="(_, i) in slides"
        :key="i"
        type="button"
        role="tab"
        class="hero__dot"
        :class="{ 'hero__dot--active': i === current }"
        :aria-selected="i === current"
        :aria-label="`Слайд ${i + 1}`"
        @click="go(i)"
      />
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  min-height: calc(100dvh - var(--header-height));
  max-height: 920px;
  background: var(--blue-dark);
  color: var(--white-100);
}

.hero__slides {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.hero__slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.85s ease,
    visibility 0.85s;
}

.hero__slide--active {
  opacity: 1;
  visibility: visible;
  z-index: 1;
}

.hero__bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transform: scale(1.04);
  transition: transform 8s linear;
}

.hero__slide--active .hero__bg {
  transform: scale(1);
}

.hero__content {
  position: relative;
  z-index: 2;
  max-width: var(--max-width);
  margin: 0 auto;
  padding: clamp(48px, 12vh, 120px) clamp(20px, 4vw, 40px) 100px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  max-width: 920px;
}

.hero__eyebrow {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: var(--white-60);
  text-shadow: 0 1px 12px rgba(0, 0, 0, 0.65);
}

.hero__title {
  font-family: var(--font-display);
  font-size: clamp(32px, 4.6vw, 58px);
  font-weight: 600;
  line-height: 1.08;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  margin: 0;
  max-width: min(22ch, 95%);
  text-shadow: 0 2px 24px rgba(0, 0, 0, 0.75);
}

.hero__subtitle {
  font-size: clamp(15px, 1.6vw, 18px);
  font-weight: 500;
  line-height: 1.55;
  color: var(--white-80);
  max-width: min(48ch, 95%);
  margin: 0;
  text-shadow: 0 1px 16px rgba(0, 0, 0, 0.7);
}

.hero__cta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}

.hero__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  padding: 16px 26px;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
  text-decoration: none;
  box-sizing: border-box;
}

.hero__btn--orange {
  background: var(--system-orange);
  color: var(--white-100);
}

.hero__btn--orange:hover {
  background: var(--orange-hover);
}

.hero__btn--outline {
  border: 1px solid hsla(0, 0%, 100%, 0.45);
  color: var(--white-100);
  background: transparent;
}

.hero__btn--outline:hover {
  background: var(--white-100);
  color: var(--blue-dark);
  border-color: var(--white-100);
}

.hero__controls {
  position: absolute;
  z-index: 3;
  inset: auto 24px 50%;
  transform: translateY(50%);
  display: flex;
  justify-content: space-between;
  pointer-events: none;
  width: calc(100% - 48px);
}

.hero__arrow {
  pointer-events: auto;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: hsla(0, 0%, 100%, 0.12);
  color: var(--white-100);
  font-size: 28px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  border: none;
  cursor: pointer;
  padding: 0;
}

.hero__arrow:hover {
  background: hsla(0, 0%, 100%, 0.22);
}

.hero__dots {
  position: absolute;
  z-index: 3;
  left: 50%;
  bottom: 32px;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
}

.hero__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: hsla(0, 0%, 100%, 0.35);
  padding: 0;
  border: none;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.hero__dot--active {
  background: var(--system-orange);
  transform: scale(1.15);
}

@media (max-width: 1024px) {
  .hero {
    min-height: calc(100dvh - var(--header-height-mobile));
    max-height: none;
  }

  .hero__content {
    padding: 40px 20px 120px;
  }

  .hero__controls {
    display: none;
  }

  .hero__dots {
    bottom: 24px;
  }
}
</style>
