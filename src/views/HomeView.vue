<script setup>
import { RouterLink } from 'vue-router'
import HeroSlideshow from '../components/HeroSlideshow.vue'

/** Те же разделы, что в шапке dtel.ru — для сетки услуг и подвала. */
const serviceCards = [
  {
    title: 'В квартиру',
    desc: 'Интернет и цифровое ТВ для квартир',
    href: 'https://dtel.ru/dlya-kvartiry',
  },
  {
    title: 'В дом',
    desc: 'Подключение частного дома и дачи',
    href: 'https://dtel.ru/dlya-doma/',
  },
  {
    title: 'Бизнесу',
    desc: 'Связь и IT для компаний',
    href: 'https://dtel.ru/dlya-biznesa/',
  },
  {
    title: 'Телевидение',
    desc: 'Пакеты каналов и тарифы ТВ',
    href: 'https://dtel.ru/tv/',
  },
  {
    title: 'Домофония',
    desc: 'Умный домофон и доступ',
    href: 'https://domofon.dtel.ru/',
  },
  {
    title: 'Веб-камеры',
    desc: 'Видеонаблюдение и камеры',
    href: 'https://dtel.ru/camera/',
  },
]

const footerServices = serviceCards

const footerNav = [
  { label: 'О компании', href: 'https://dtel.ru/o-nas/' },
  { label: 'Новости', href: 'https://dtel.ru/news' },
  { label: 'Контакты', href: 'https://dtel.ru/kontakty/' },
  { label: 'Оплата', href: 'https://dtel.ru/oplata/' },
]
</script>

<template>
  <div class="home">
    <HeroSlideshow />

    <section class="services-section">
      <div class="container">
        <h2 class="section-title">Услуги</h2>
        <p class="section-lead">
          Интернет, цифровое телевидение, телефония и смарт-сервисы для дома и бизнеса. Переходите в разделы — на
          dtel.ru доступны тарифы и заявка на подключение.
        </p>
        <div class="services-grid">
          <a
            v-for="item in serviceCards"
            :key="item.title"
            :href="item.href"
            class="service-card"
            rel="noopener noreferrer"
          >
            <span class="service-card__title">{{ item.title }}</span>
            <span class="service-card__desc">{{ item.desc }}</span>
            <span class="service-card__arrow" aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>

    <section class="stats-section">
      <div class="container stats-grid">
        <div class="stat">
          <span class="stat__value">2008</span>
          <span class="stat__label">год начала работы в регионе</span>
        </div>
        <div class="stat">
          <span class="stat__value">2500+</span>
          <span class="stat__label">км оптических линий (собственная сеть)</span>
        </div>
        <div class="stat">
          <span class="stat__value">Большой Сочи</span>
          <span class="stat__label">и развитие в Туапсинском районе</span>
        </div>
        <div class="stat">
          <span class="stat__value">24/7</span>
          <span class="stat__label">техническая поддержка абонентов</span>
        </div>
      </div>
    </section>

    <section class="cta-section">
      <div class="container cta-section__inner">
        <div class="cta-section__text">
          <h2 class="cta-section__title">Подключение интернета</h2>
          <p class="cta-section__lead">
            Оставьте заявку на сайте оператора или уточните возможность подключения по телефону — специалист подберёт
            тариф под ваш адрес.
          </p>
        </div>
        <a href="tel:+78622000000" class="cta-section__phone">8 (862) 200-00-00</a>
      </div>
    </section>

    <section id="registraciya-rozygrysh" class="reg-teaser" tabindex="-1">
      <div class="reg-teaser__inner container">
        <h2 class="reg-teaser__title">Регистрация в корпоративном розыгрыше</h2>
        <p class="reg-teaser__text">
          Учебный сценарий: участие сотрудников ко дню компании. Перейдите к форме регистрации.
        </p>
        <RouterLink to="/register" class="reg-teaser__btn">Перейти к регистрации</RouterLink>
      </div>
    </section>

    <footer class="site-footer">
      <div class="container site-footer__grid">
        <div class="site-footer__brand">
          <span class="site-footer__logo">DTEL</span>
          <p class="site-footer__addr">
            ООО «Дагомыс Телеком» · интернет-провайдер<br />
            г. Сочи · работа в регионе от Сочи до Туапсе
          </p>
        </div>
        <div class="site-footer__col">
          <p class="site-footer__heading">Услуги</p>
          <ul class="site-footer__list">
            <li v-for="l in footerServices" :key="l.href">
              <a :href="l.href" rel="noopener noreferrer">{{ l.title }}</a>
            </li>
          </ul>
        </div>
        <div class="site-footer__col">
          <p class="site-footer__heading">Компания</p>
          <ul class="site-footer__list">
            <li v-for="l in footerNav" :key="l.href">
              <a :href="l.href" rel="noopener noreferrer">{{ l.label }}</a>
            </li>
          </ul>
        </div>
        <div class="site-footer__col">
          <p class="site-footer__heading">Связь</p>
          <ul class="site-footer__list">
            <li>
              <a href="tel:+78622000000">8 (862) 200-00-00</a>
            </li>
            <li>
              <a href="https://lk.dtel.ru/" rel="noopener noreferrer">lk.dtel.ru</a>
            </li>
            <li>
              <a href="https://dtel.ru/" rel="noopener noreferrer">dtel.ru</a>
            </li>
          </ul>
        </div>
      </div>
      <div class="site-footer__bottom">
        <div class="container site-footer__bottom-inner">
          <span>© Dtel, 2026 · ООО «Дагомыс Телеком». Учебный макет: ссылки ведут на официальный сайт dtel.ru.</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.home {
  min-height: 100%;
  background: #fff;
}

.container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding-left: var(--offset-side-mobile);
  padding-right: var(--offset-side-mobile);
}

@media (min-width: 768px) {
  .container {
    padding-left: var(--offset-side-tablet);
    padding-right: var(--offset-side-tablet);
  }
}

@media (min-width: 1280px) {
  .container {
    padding-left: var(--offset-side-desktop);
    padding-right: var(--offset-side-desktop);
  }
}

/* ——— Услуги ——— */
.services-section {
  padding: var(--offset-top-mobile) 0 var(--offset-bottom-mobile);
  background: #fff;
  border-top: 1px solid var(--dtel-header-divider);
}

@media (min-width: 768px) {
  .services-section {
    padding: var(--offset-top-tablet) 0 var(--offset-bottom-tablet);
  }
}

@media (min-width: 1280px) {
  .services-section {
    padding: var(--offset-top-desktop) 0 var(--offset-bottom-desktop);
  }
}

.section-title {
  font-family: var(--font-display);
  font-size: clamp(26px, 3.5vw, 36px);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--gray-100);
  margin: 0 0 12px;
}

.section-lead {
  font-size: 16px;
  line-height: 1.55;
  color: var(--gray-100);
  opacity: 0.85;
  max-width: 48em;
  margin: 0 0 40px;
}

.services-grid {
  display: grid;
  gap: 1px;
  background: var(--dtel-header-divider);
  border: 1px solid var(--dtel-header-divider);
  grid-template-columns: 1fr;
}

@media (min-width: 600px) {
  .services-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .services-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.service-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 24px 20px;
  background: #fff;
  text-decoration: none;
  color: inherit;
  transition: background 0.2s;
  min-height: 132px;
  position: relative;
}

.service-card:hover {
  background: var(--page-background);
}

.service-card__title {
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.35px;
  text-transform: uppercase;
  color: var(--gray-100);
}

.service-card__desc {
  font-size: 14px;
  line-height: 1.45;
  color: var(--gray-100);
  opacity: 0.75;
  flex: 1;
}

.service-card__arrow {
  font-size: 18px;
  color: var(--system-orange);
  align-self: flex-end;
}

/* ——— Цифры ——— */
.stats-section {
  padding: var(--offset-top-mobile) 0 var(--offset-bottom-mobile);
  background: var(--page-background);
  border-top: 1px solid var(--dtel-header-divider);
}

@media (min-width: 768px) {
  .stats-section {
    padding: var(--offset-top-tablet) 0 var(--offset-bottom-tablet);
  }
}

@media (min-width: 1280px) {
  .stats-section {
    padding: var(--offset-top-desktop) 0 var(--offset-bottom-desktop);
  }
}

.stats-grid {
  display: grid;
  gap: 32px;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat__value {
  font-family: var(--font-display);
  font-size: clamp(22px, 2.5vw, 28px);
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--blue-default);
}

.stat__label {
  font-size: 14px;
  line-height: 1.45;
  color: var(--gray-100);
  opacity: 0.65;
}

/* ——— CTA ——— */
.cta-section {
  background: var(--blue-gradient);
  color: #fff;
  padding: var(--offset-top-mobile) 0 var(--offset-bottom-mobile);
}

@media (min-width: 768px) {
  .cta-section {
    padding: var(--offset-top-tablet) 0 var(--offset-bottom-tablet);
  }
}

@media (min-width: 1280px) {
  .cta-section {
    padding: var(--offset-top-desktop) 0 var(--offset-bottom-desktop);
  }
}

.cta-section__inner {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: flex-start;
}

@media (min-width: 900px) {
  .cta-section__inner {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.cta-section__title {
  font-family: var(--font-display);
  font-size: clamp(22px, 2.5vw, 28px);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin: 0 0 10px;
}

.cta-section__lead {
  font-size: 15px;
  line-height: 1.55;
  color: var(--white-80);
  margin: 0;
  max-width: 36em;
}

.cta-section__phone {
  font-family: var(--font-display);
  font-size: clamp(22px, 3vw, 32px);
  font-weight: 600;
  letter-spacing: 0.06em;
  color: #fff;
  text-decoration: none;
  white-space: nowrap;
  border: 2px solid var(--white-40, hsla(0, 0%, 100%, 0.4));
  padding: 16px 28px;
  transition: background 0.2s, border-color 0.2s;
}

.cta-section__phone:hover {
  background: hsla(0, 0%, 100%, 0.1);
  border-color: #fff;
}

/* ——— Учебный блок розыгрыша ——— */
.reg-teaser {
  scroll-margin-top: calc(var(--header-height) + 16px);
  background: #fff;
  border-top: 1px solid var(--dtel-header-divider);
  padding: var(--offset-top-mobile) 0 var(--offset-bottom-mobile);
}

@media (min-width: 768px) {
  .reg-teaser {
    padding: var(--offset-top-tablet) 0 var(--offset-bottom-tablet);
  }
}

@media (min-width: 1280px) {
  .reg-teaser {
    padding: var(--offset-top-desktop) 0 var(--offset-bottom-desktop);
  }
}

.reg-teaser__inner {
  max-width: 720px;
  margin: 0 auto;
  text-align: center;
}

.reg-teaser__title {
  font-family: var(--font-display);
  font-size: clamp(20px, 2.5vw, 26px);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--gray-100);
  margin: 0 0 12px;
}

.reg-teaser__text {
  font-size: 15px;
  line-height: 1.55;
  color: var(--gray-100);
  opacity: 0.85;
  margin: 0 0 20px;
}

.reg-teaser__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.35px;
  text-transform: uppercase;
  padding: 16px 28px;
  background: var(--system-orange);
  color: #fff;
  text-decoration: none;
  transition: background 0.2s;
}

.reg-teaser__btn:hover {
  background: var(--orange-hover);
}

/* ——— Подвал ——— */
.site-footer {
  background: var(--dtel-header-bg);
  color: #fff;
  padding: var(--offset-top-mobile) 0 0;
}

@media (min-width: 768px) {
  .site-footer {
    padding-top: var(--offset-top-tablet);
  }
}

@media (min-width: 1280px) {
  .site-footer {
    padding-top: var(--offset-top-desktop);
  }
}

.site-footer__grid {
  display: grid;
  gap: 40px;
  padding-bottom: 40px;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .site-footer__grid {
    grid-template-columns: 1.2fr repeat(3, 1fr);
  }
}

.site-footer__logo {
  font-family: var(--font-dtel-wordmark);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.12em;
  display: inline-block;
  margin-bottom: 12px;
}

.site-footer__addr {
  font-size: 14px;
  line-height: 1.55;
  color: #9d9d9d;
  margin: 0;
}

.site-footer__heading {
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.35px;
  text-transform: uppercase;
  color: var(--white-60);
  margin: 0 0 16px;
}

.site-footer__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.site-footer__list a {
  font-size: 14px;
  color: #e6e6e6;
  text-decoration: none;
}

.site-footer__list a:hover {
  color: #fff;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.site-footer__bottom {
  border-top: 1px solid var(--dtel-header-divider);
  padding: 20px 0;
}

.site-footer__bottom-inner {
  font-size: 12px;
  line-height: 1.5;
  color: #6c6c6c;
}

@media (max-width: 1024px) {
  .reg-teaser {
    scroll-margin-top: calc(var(--header-height-mobile) + 12px);
  }
}
</style>
