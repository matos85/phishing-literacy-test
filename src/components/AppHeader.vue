<script setup>
/**
 * Шапка по образцу newsite-front `app/components/Layout/Header/Header.vue`
 * (сетка, отступы, логотип `icons:logo` → файл `public/icons/logo.svg`).
 * Шрифты: TTBluescreens / TTFirsNeue / Manrope — локально (style.css + main.js).
 */
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import DtelHeaderLogo from './DtelHeaderLogo.vue'

const menuOpen = ref(false)

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
  <header class="dtel-header header">
    <div class="header__container">
      <div class="header__top header-top">
        <div class="header-top__home">
          <RouterLink to="/register" class="header-top__home-link" @click="closeMenu">
            <DtelHeaderLogo class="header-top__logo" />
          </RouterLink>
        </div>

        <button
          type="button"
          class="header-top__menu-button burger"
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

        <a
          :href="accountHref"
          class="header-top__profile-button"
          rel="noopener noreferrer"
          aria-label="Личный кабинет"
        >
          <svg class="header-top__profile-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
            />
          </svg>
        </a>

        <div class="header-top__navigation">
          <div class="header-top__navigation-links">
            <a
              v-for="(l, i) in topLinks"
              :key="l.label"
              :href="l.href"
              class="header-top__nav-link"
              rel="noopener noreferrer"
              :class="{ 'header-top__nav-link--sep': i > 0 }"
            >
              {{ l.label }}
            </a>
          </div>
          <a :href="accountHref" class="header-top__nav-link header-top__nav-link--cabinet" rel="noopener noreferrer">
            Личный кабинет
          </a>
        </div>
      </div>

      <nav class="header__bottom header-bottom" aria-label="Услуги">
        <a
          v-for="l in primaryLinks"
          :key="l.label"
          :href="l.href"
          class="header-bottom__link"
          rel="noopener noreferrer"
        >
          {{ l.label }}
        </a>
      </nav>
    </div>

    <div
      id="dtel-mobile-nav"
      class="mobile-drawer"
      :class="{ 'mobile-drawer--open': menuOpen }"
      :aria-hidden="!menuOpen"
    >
      <button type="button" class="mobile-drawer__backdrop" tabindex="-1" aria-label="Закрыть меню" @click="closeMenu" />
      <div class="mobile-drawer__panel" role="dialog" aria-modal="true" aria-label="Меню навигации">
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
  font-family: TTBluescreens, TTFirsNeue, 'Manrope', system-ui, sans-serif;
}

.header__container {
  max-width: var(--max-width, 1980px);
  margin: 0 auto;
  border-left: 1px solid var(--dtel-header-divider);
  border-right: 1px solid var(--dtel-header-divider);
}

.header__top,
.header__bottom {
  display: grid;
  justify-items: stretch;
  align-items: stretch;
  height: var(--header-top-row);
  border-bottom: 1px solid var(--dtel-header-divider);
}

.header__top {
  grid-template-areas: 'home menu navigation';
  grid-template-columns: 231px 100px minmax(0, 1fr);
}

.header__bottom {
  grid-template-columns: repeat(6, 1fr);
  height: var(--header-bottom-row);
}

.header-top,
.header-bottom {
  box-sizing: border-box;
}

.header-top > *,
.header-bottom > * {
  width: 100%;
  height: 100%;
}

.header-top > :not(:last-child),
.header-bottom > :not(:last-child) {
  border-right: 1px solid var(--dtel-header-divider);
}

.header-top__home {
  grid-area: home;
  display: flex;
  align-items: center;
  padding-left: var(--offset-side-desktop, 40px);
}

.header-top__home-link {
  display: inline-flex;
  align-items: center;
  color: inherit;
  text-decoration: none;
}

.header-top__logo {
  display: block;
  color: #fff;
  height: 26px;
  width: auto;
  max-width: min(151px, 46vw);
}

.header-top__menu-button {
  grid-area: menu;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  cursor: pointer;
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

.header-top__navigation {
  grid-area: navigation;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 50px;
  padding: 0 50px;
}

.header-top__navigation-links {
  display: flex;
  align-items: center;
  gap: 50px;
}

.header-top__nav-link {
  font-weight: 600;
  font-size: clamp(11px, 1vw, 13px);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #fff;
  text-decoration: none;
  white-space: nowrap;
  transition: opacity 0.15s;
}

.header-top__nav-link:hover {
  opacity: 0.82;
}

.header-top__nav-link--sep {
  border-left: 1px solid var(--dtel-header-divider);
  padding-left: 50px;
  margin-left: -50px;
}

.header-top__nav-link--cabinet {
  flex-shrink: 0;
}

.header-top__profile-button {
  grid-area: profile;
  display: none;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.header-top__profile-icon {
  width: 22px;
  height: 22px;
  display: block;
}

.header-bottom__link {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-weight: 600;
  font-size: clamp(11px, 1vw, 13px);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #fff;
  text-decoration: none;
  padding: 10px 6px;
  transition: background 0.15s, opacity 0.15s;
}

.header-bottom__link:hover {
  background: rgba(255, 255, 255, 0.06);
}

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
  text-decoration: none;
  padding: 14px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.mobile-drawer__link--accent {
  margin-top: 8px;
  border-bottom: none;
}

@media (max-width: 1024px) {
  .header__top {
    grid-template-areas: 'home profile menu';
    grid-template-columns: minmax(180px, auto) minmax(0, 80px) minmax(0, 80px);
    height: var(--header-top-row);
  }

  .header__bottom {
    display: flex;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scroll-snap-type: x proximity;
  }

  .header-bottom__link {
    flex: 0 0 auto;
    min-width: 44vw;
    max-width: 200px;
    border-right: 1px solid var(--dtel-header-divider);
    scroll-snap-align: start;
  }

  .header-top__home {
    padding-left: var(--offset-side-tablet, 30px);
  }

  .header-top__navigation {
    display: none;
  }

  .header-top__profile-button {
    display: flex;
    border-right: 1px solid var(--dtel-header-divider);
  }

  .header-top__menu-button {
    border-right: none;
  }
}

@media (max-width: 768px) {
  .header__top {
    grid-template-columns: minmax(180px, auto) minmax(0, 70px) minmax(0, 70px);
  }
}

@media (max-width: 480px) {
  .header-top__home {
    padding-left: var(--offset-side-mobile, 12px);
  }
}
</style>
