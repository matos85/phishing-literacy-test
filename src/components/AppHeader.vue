<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'

const menuOpen = ref(false)

/** Как на официальном сайте: те же пути, что у dtel.ru (поддомены — родные сервисы). */
const topLinks = [
  { label: 'Контакты', href: 'https://dtel.ru/kontakty/' },
  { label: 'Новости', href: 'https://dtel.ru/news' },
  { label: 'Оплата', href: 'https://dtel.ru/oplata/' },
]

const primaryLinks = [
  { label: 'В квартиру', href: 'https://dtel.ru/dlya-kvartiry' },
  { label: 'В дом', href: 'https://dtel.ru/dlya-doma/' },
  { label: 'Бизнесу', href: 'https://dtel.ru/dlya-biznesa/' },
  { label: 'Телевидение', href: 'https://dtel.ru/tv/' },
  { label: 'Домофония', href: 'https://domofon.dtel.ru/' },
  { label: 'Веб-камеры', href: 'https://dtel.ru/camera/' },
]

const accountHref = 'https://lk.dtel.ru/'

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}

function onEscape(e) {
  if (e.key === 'Escape' && menuOpen.value) {
    closeMenu()
  }
}

watch(menuOpen, (open) => {
  document.body.classList.toggle('overflow-hidden', open)
})

onMounted(() => {
  window.addEventListener('keydown', onEscape)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onEscape)
  document.body.classList.remove('overflow-hidden')
})
</script>

<template>
  <header class="dtel-header">
    <div class="dtel-header__top">
      <div class="cell cell--brand">
        <RouterLink to="/" class="brand" @click="closeMenu">
          <svg
            class="brand__mark"
            width="38"
            height="42"
            viewBox="0 0 38 42"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <!-- Геометрическая «D»: вертикальная стойка + две наклонные плоскости -->
            <path fill="currentColor" d="M3 4h9v34H3V4z" />
            <path fill="currentColor" d="M12 4h2.2L31 10.5v6.2L14 9.2V4H12zm0 28.8V22.4l17-5.2v8.5L14.2 38H12v-5.2z" />
          </svg>
          <span class="brand__word">DTEL</span>
        </RouterLink>
      </div>

      <div class="cell cell--burger">
        <button
          type="button"
          class="burger"
          :class="{ 'burger--open': menuOpen }"
          :aria-expanded="menuOpen"
          aria-controls="dtel-mobile-nav"
          :aria-label="menuOpen ? 'Закрыть меню' : 'Открыть меню'"
          @click="toggleMenu"
        >
          <span class="burger__bar" />
          <span class="burger__bar" />
          <span class="burger__bar" />
        </button>
      </div>

      <nav class="cell cell--mid" aria-label="Дополнительные разделы">
        <a
          v-for="(l, i) in topLinks"
          :key="l.label"
          :href="l.href"
          class="mid-link"
          rel="noopener noreferrer"
          :class="{ 'mid-link--sep': i > 0 }"
        >
          {{ l.label }}
        </a>
      </nav>

      <div class="cell cell--account">
        <a :href="accountHref" class="account-link" rel="noopener noreferrer">Личный кабинет</a>
      </div>
    </div>

    <nav class="dtel-header__bottom" aria-label="Услуги">
      <a
        v-for="l in primaryLinks"
        :key="l.label"
        :href="l.href"
        class="primary-link"
        rel="noopener noreferrer"
      >
        {{ l.label }}
      </a>
    </nav>

    <div
      id="dtel-mobile-nav"
      class="mobile-drawer"
      :class="{ 'mobile-drawer--open': menuOpen }"
      :aria-hidden="!menuOpen"
    >
      <button
        type="button"
        class="mobile-drawer__backdrop"
        tabindex="-1"
        aria-label="Закрыть меню"
        @click="closeMenu"
      />
      <div
        class="mobile-drawer__panel"
        role="dialog"
        aria-modal="true"
        :aria-label="'Меню навигации'"
      >
        <nav class="mobile-drawer__nav" aria-label="Полное меню">
          <p class="mobile-drawer__title">Услуги</p>
          <a
            v-for="l in primaryLinks"
            :key="'m-' + l.label"
            :href="l.href"
            class="mobile-drawer__link"
            rel="noopener noreferrer"
            @click="closeMenu"
          >
            {{ l.label }}
          </a>
          <p class="mobile-drawer__title">Разделы</p>
          <a
            v-for="l in topLinks"
            :key="'t-' + l.label"
            :href="l.href"
            class="mobile-drawer__link"
            rel="noopener noreferrer"
            @click="closeMenu"
          >
            {{ l.label }}
          </a>
          <a
            :href="accountHref"
            class="mobile-drawer__link mobile-drawer__link--accent"
            rel="noopener noreferrer"
            @click="closeMenu"
          >
            Личный кабинет
          </a>
        </nav>
      </div>
    </div>
  </header>
</template>

<style scoped>
.dtel-header {
  position: fixed;
  inset: 0 0 auto;
  z-index: 100;
  background: var(--dtel-header-bg);
  color: #fff;
  font-family: var(--font-display);
}

.dtel-header__top {
  display: flex;
  align-items: stretch;
  min-height: var(--header-top-row);
  border-bottom: 1px solid var(--dtel-header-divider);
}

.cell {
  display: flex;
  align-items: center;
  border-right: 1px solid var(--dtel-header-divider);
}

.cell:last-child {
  border-right: none;
}

.cell--brand {
  flex: 0 0 auto;
  padding: 0 clamp(16px, 2vw, 28px);
}

.cell--burger {
  flex: 0 0 auto;
  justify-content: center;
  width: 56px;
  padding: 0;
}

.cell--mid {
  flex: 1 1 auto;
  justify-content: center;
  gap: 0;
  min-width: 0;
  flex-wrap: wrap;
  padding: 8px 12px;
}

.cell--account {
  flex: 0 0 auto;
  justify-content: center;
  padding: 0 clamp(16px, 2vw, 28px);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: #fff;
}

.brand__mark {
  flex-shrink: 0;
  color: #fff;
}

.brand__word {
  font-family: var(--font-dtel-wordmark);
  font-weight: 600;
  font-size: clamp(17px, 1.35vw, 21px);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  line-height: 1;
}

.mid-link {
  font-weight: 600;
  font-size: clamp(11px, 1vw, 13px);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #fff;
  padding: 8px clamp(14px, 1.8vw, 28px);
  white-space: nowrap;
  transition: opacity 0.15s;
}

.mid-link:hover {
  opacity: 0.82;
}

.mid-link--sep {
  border-left: 1px solid var(--dtel-header-divider);
}

.account-link {
  font-weight: 600;
  font-size: clamp(11px, 1vw, 13px);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #fff;
  white-space: nowrap;
  transition: opacity 0.15s;
}

.account-link:hover {
  opacity: 0.82;
}

.burger {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  width: 100%;
  height: 100%;
  min-height: var(--header-top-row);
  padding: 0;
}

.burger__bar {
  display: block;
  width: 20px;
  height: 2px;
  background: #fff;
  transition:
    transform 0.25s ease,
    opacity 0.2s ease;
  transform-origin: center;
}

.burger--open .burger__bar:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.burger--open .burger__bar:nth-child(2) {
  opacity: 0;
}

.burger--open .burger__bar:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

.dtel-header__bottom {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  align-items: stretch;
  min-height: var(--header-bottom-row);
}

.primary-link {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-weight: 600;
  font-size: clamp(11px, 1vw, 13px);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #fff;
  border-right: 1px solid var(--dtel-header-divider);
  padding: 10px 6px;
  transition: background 0.15s, opacity 0.15s;
}

.primary-link:last-child {
  border-right: none;
}

.primary-link:hover {
  background: rgba(255, 255, 255, 0.06);
}

/* Оверлей меню — как на dtel.ru: бургер на всех ширинах, панель по клику */
.mobile-drawer {
  display: flex;
  position: fixed;
  inset: 0;
  top: var(--header-height);
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 150;
  pointer-events: none;
}

.mobile-drawer--open {
  pointer-events: auto;
}

.mobile-drawer__backdrop {
  flex: 1 1 auto;
  min-width: 0;
  align-self: stretch;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.45);
  opacity: 0;
  transition: opacity 0.28s ease;
}

.mobile-drawer--open .mobile-drawer__backdrop {
  opacity: 1;
}

.mobile-drawer__panel {
  flex: 0 0 min(360px, 88vw);
  max-width: 420px;
  align-self: stretch;
  background: var(--mobile-menu);
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.35);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  transform: translateX(100%);
  transition: transform 0.28s ease;
  padding: 20px 20px 32px;
}

.mobile-drawer--open .mobile-drawer__panel {
  transform: translateX(0);
}

.mobile-drawer__title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
  margin: 16px 0 8px;
}

.mobile-drawer__title:first-child {
  margin-top: 0;
}

.mobile-drawer__link {
  display: block;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #fff;
  padding: 14px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.mobile-drawer__link--accent {
  margin-top: 8px;
  border-bottom: none;
}

@media (max-width: 1024px) {
  .cell--mid,
  .cell--account {
    display: none;
  }

  .cell--burger {
    border-right: none;
    border-left: 1px solid var(--dtel-header-divider);
  }

  .dtel-header__top {
    justify-content: space-between;
  }

  .cell--brand {
    border-right: none;
    flex: 1 1 auto;
  }

  .dtel-header__bottom {
    display: flex;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scroll-snap-type: x proximity;
    border-bottom: 1px solid var(--dtel-header-divider);
  }

  .primary-link {
    flex: 0 0 auto;
    min-width: 44vw;
    max-width: 200px;
    border-right: 1px solid var(--dtel-header-divider);
    scroll-snap-align: start;
  }
}
</style>
