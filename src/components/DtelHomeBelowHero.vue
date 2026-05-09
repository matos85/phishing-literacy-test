<script setup>
/**
 * Визуальный клон блоков главной dtel.ru сразу под полноэкранным слайдером:
 * сетка «Домофония / Веб-камеры», «О нас» + новость, «Быстрая оплата», подвал.
 * Изображения и внешние ссылки — на официальный сайт (как на оригинале).
 */
const DTEL = 'https://dtel.ru'

const blockCards = [
  {
    href: `${DTEL}/intercom/`,
    header: 'Домофония',
    titleLines: ['умный домофон', 'от dtel'],
    description: 'Контроль доступа',
    img: `${DTEL}/images/backgrounds/main_intercom.png`,
  },
  {
    href: `${DTEL}/camera/`,
    header: 'Веб-камеры',
    titleLines: ['более 80', 'веб–камер'],
    description: 'Онлайн-доступ к важным местам',
    img: `${DTEL}/images/backgrounds/main_cameras.png`,
  },
]

const footerCompany = [
  { label: 'О нас', href: `${DTEL}/o-nas/` },
  { label: 'Благотворительность', href: `${DTEL}/charity/` },
  { label: 'Контакты', href: `${DTEL}/kontakty/` },
  { label: 'Вакансии', href: `${DTEL}/vakansii-kompanii/` },
  { label: 'Новости', href: `${DTEL}/news/` },
  { label: 'Подрядчики', href: `${DTEL}/podryad/` },
]

const footerProducts = [
  { label: 'В квартиру', href: `${DTEL}/dlya-kvartiry/` },
  { label: 'В частный дом', href: `${DTEL}/dlya-doma/` },
  { label: 'Бизнесу', href: `${DTEL}/dlya-biznesa/` },
  { label: 'Телевидение', href: `${DTEL}/tv/` },
  { label: 'Домофония', href: `${DTEL}/intercom/` },
  { label: 'Веб-камеры', href: `${DTEL}/camera/` },
]

const footerInfo = [
  { label: 'Документация', href: `${DTEL}/blanki-i-dokumenty/` },
  { label: 'Реквизиты', href: `${DTEL}/rekvizity/` },
  { label: 'Коллективная заявка', href: `${DTEL}/collectiv/` },
  { label: 'Оплата услуг', href: `${DTEL}/oplata/` },
  { label: 'Регламент', href: `${DTEL}/soglasie/` },
]

const footerService = [
  { label: 'Оборудование', href: `${DTEL}/oborudovanie/` },
  { label: 'Инструкции', href: `${DTEL}/videoinstruktsii/` },
]

const newsItem = {
  href: `${DTEL}/news/kompaniya-dtelru-finalist-iii-nacionalnoj-premii/`,
  date: '5 марта 2026',
  title: 'Компания Dtel.ru — финалист III Национальной премии',
  image: `${DTEL}/uploads/width_480,format_png/uploads/noroot_png_9ee63f58c5.webp`,
}

const aboutText =
  'Dtel\u00a0— телеком-оператор, работающий с\u00a02008 года и\u00a0предоставляющий высокоскоростной интернет, ТВ, телефонию, IP-домофонию и\u00a0видеонаблюдение для частных и\u00a0корпоративных клиентов в\u00a0Большом Сочи и\u00a0Краснодарском крае.'
</script>

<template>
  <div class="dtel-below">
    <div class="dtel-below__wrap">
      <!-- Две карточки как mainpage__links-grid на dtel.ru -->
      <div class="dtel-links-grid">
        <div v-for="card in blockCards" :key="card.href" class="dtel-block-link">
          <a class="dtel-block-link__hit" :href="card.href" rel="noopener noreferrer" :aria-label="card.header" />
          <picture class="dtel-block-link__bg">
            <img :src="card.img" :alt="card.header" width="1980" height="1200" loading="lazy" />
          </picture>
          <div class="dtel-block-link__header">
            <span class="dtel-block-link__header-text">{{ card.header }}</span>
            <a :href="`${DTEL}/oplata/`" class="dtel-block-link__pay" rel="noopener noreferrer">Оплата</a>
          </div>
          <h2 class="dtel-block-link__title">
            <span class="dtel-block-link__title-inner">
              <template v-for="(line, i) in card.titleLines" :key="i">
                <br v-if="i > 0" />
                {{ line }}
              </template>
            </span>
          </h2>
          <div class="dtel-block-link__footer">
            <p class="dtel-block-link__desc">{{ card.description }}</p>
          </div>
        </div>
      </div>

      <!-- О нас + Новости -->
      <div class="dtel-sections dtel-sections--desktop">
        <div class="dtel-section dtel-section--left">
          <div class="dtel-section__head">
            <h3 class="dtel-subtitle dtel-subtitle--h3">О нас</h3>
            <a class="dtel-section__more" :href="`${DTEL}/o-nas/`" rel="noopener noreferrer">Перейти в раздел</a>
          </div>
          <p class="dtel-section__body">{{ aboutText }}</p>
        </div>
        <div class="dtel-section dtel-section--right">
          <div class="dtel-section__head">
            <h3 class="dtel-subtitle dtel-subtitle--h3">Новости</h3>
            <a class="dtel-section__more" :href="`${DTEL}/news/`" rel="noopener noreferrer">Перейти в раздел</a>
          </div>
          <div class="dtel-news-grid">
            <a :href="newsItem.href" class="dtel-article-card" rel="noopener noreferrer">
              <div class="dtel-article-card__img-wrap">
                <img :src="newsItem.image" :alt="newsItem.title" loading="lazy" />
              </div>
              <p class="dtel-article-card__date">{{ newsItem.date }}</p>
              <p class="dtel-article-card__title">{{ newsItem.title }}</p>
            </a>
          </div>
        </div>
      </div>

      <div class="dtel-sections dtel-sections--mobile">
        <div class="dtel-section">
          <div class="dtel-section__head">
            <h3 class="dtel-subtitle dtel-subtitle--h3">О нас</h3>
            <a class="dtel-section__more" :href="`${DTEL}/o-nas/`" rel="noopener noreferrer">Перейти в раздел</a>
          </div>
          <p class="dtel-section__body">{{ aboutText }}</p>
        </div>
        <div class="dtel-section dtel-section--news-m">
          <div class="dtel-section__head">
            <h3 class="dtel-subtitle dtel-subtitle--h3">Новости</h3>
            <a class="dtel-section__more" :href="`${DTEL}/news/`" rel="noopener noreferrer">Перейти в раздел</a>
          </div>
          <a :href="newsItem.href" class="dtel-article-card" rel="noopener noreferrer">
            <div class="dtel-article-card__img-wrap">
              <img :src="newsItem.image" :alt="newsItem.title" loading="lazy" />
            </div>
            <p class="dtel-article-card__date">{{ newsItem.date }}</p>
            <p class="dtel-article-card__title">{{ newsItem.title }}</p>
          </a>
        </div>
      </div>

      <!-- Быстрая оплата -->
      <div class="dtel-container">
        <h2 class="dtel-subtitle dtel-subtitle--h2">быстрая оплата</h2>
        <form class="dtel-payment" @submit.prevent>
          <div class="dtel-payment__grid">
            <div class="dtel-field">
              <label class="dtel-field__label" for="dtel-pay-contract">Номер договора*</label>
              <input id="dtel-pay-contract" class="dtel-field__input" type="number" autocomplete="off" />
              <p class="dtel-field__err">Введите номер договора</p>
            </div>
            <div class="dtel-field">
              <label class="dtel-field__label" for="dtel-pay-sum">Сумма платежа, ₽*</label>
              <input id="dtel-pay-sum" class="dtel-field__input" type="number" autocomplete="off" />
              <p class="dtel-field__err">Введите сумму</p>
            </div>
            <div class="dtel-field dtel-field--ok">
              <label class="dtel-field__label" for="dtel-pay-mail">Отправить чек на почту</label>
              <input id="dtel-pay-mail" class="dtel-field__input" type="email" autocomplete="email" />
            </div>
          </div>
          <div class="dtel-payment__actions">
            <button type="button" class="dtel-btn dtel-btn--blue" disabled>Система быстрых платежей</button>
            <p class="dtel-payment__note dtel-payment__note--first">
              После успешной оплаты
              <span class="dtel-underline">на указанную Вами электронную почту будет направлен электронный чек</span>
              Сервис Сбербанка гарантирует безопасность и полную защиту вашей личной информации.
            </p>
            <button type="button" class="dtel-btn dtel-btn--blue" disabled>Оплата картой</button>
            <div class="dtel-payment__note-wrap">
              <p class="dtel-payment__note">
                Передача информации осуществляется по закрытым банковским сетям высшей степени защиты. Обработка
                полученных конфиденциальных данных клиента (реквизиты карты, регистрационные данные и т.д.) производится
                в процессинговом центре.
              </p>
              <p class="dtel-payment__note">
                Таким образом, никто не может получить персональные и банковские данные клиента.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Подвал как на dtel.ru -->
    <footer class="dtel-footer">
      <div class="dtel-footer__menu">
        <div class="dtel-footer__menu-inner dtel-container dtel-container--footer-top">
          <div class="dtel-footer__grid">
            <div class="dtel-footer__scene" aria-hidden="true" />
            <div class="dtel-footer__nav">
              <div class="dtel-footer__nav-cell dtel-footer__nav-cell--company">
                <div class="dtel-fgroup dtel-fgroup--margin">
                  <p class="dtel-fgroup__title">Компания</p>
                  <div class="dtel-fgroup__links">
                    <a v-for="l in footerCompany" :key="l.href" :href="l.href" rel="noopener noreferrer">{{ l.label }}</a>
                  </div>
                </div>
              </div>
              <div class="dtel-footer__nav-cell dtel-footer__nav-cell--products">
                <div class="dtel-fgroup dtel-fgroup--margin">
                  <p class="dtel-fgroup__title">Услуги</p>
                  <div class="dtel-fgroup__links dtel-fgroup__links--large">
                    <a v-for="l in footerProducts" :key="l.href" :href="l.href" rel="noopener noreferrer">{{ l.label }}</a>
                  </div>
                </div>
              </div>
              <div class="dtel-footer__nav-cell dtel-footer__nav-cell--info">
                <div class="dtel-fgroup">
                  <p class="dtel-fgroup__title">Инфо</p>
                  <div class="dtel-fgroup__links">
                    <a v-for="l in footerInfo" :key="l.href" :href="l.href" rel="noopener noreferrer">{{ l.label }}</a>
                  </div>
                </div>
              </div>
              <div class="dtel-footer__nav-cell dtel-footer__nav-cell--service">
                <div class="dtel-fgroup">
                  <p class="dtel-fgroup__title">Сервис</p>
                  <div class="dtel-fgroup__links">
                    <a v-for="l in footerService" :key="l.href" :href="l.href" rel="noopener noreferrer">{{ l.label }}</a>
                  </div>
                </div>
              </div>
              <div class="dtel-footer__nav-cell dtel-footer__nav-cell--contacts-tab">
                <div class="dtel-fgroup">
                  <p class="dtel-fgroup__title">Контакты</p>
                  <p class="dtel-info-block__line">Сочи, ул. Виноградная, 20А (этаж 1)</p>
                  <p class="dtel-info-block__line dtel-info-block__hours">09:00 — 18:00</p>
                  <a class="dtel-info-block__line" href="tel:88622000000" rel="noopener noreferrer">+7 (862) 2–000–000</a>
                  <a class="dtel-info-block__line dtel-info-block__email" href="mailto:client@dtel.ru" rel="noopener noreferrer"
                    >client@dtel.ru</a
                  >
                  <div class="dtel-info-block__social">
                    <a href="https://vk.ru/dtel_ru" class="dtel-soc-btn" rel="noopener noreferrer" aria-label="ВКонтакте">
                      <svg class="dtel-soc-btn__ico" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M1.687 1.687C0 3.374 0 6.089 0 11.52v.96c0 5.391 0 8.106 1.687 9.793C3.374 24 6.089 24 11.52 24h.96c5.431 0 8.146 0 9.833-1.687C24 20.626 24 17.911 24 12.48v-.96c0-5.391 0-8.106-1.687-9.833C20.626 0 17.911 0 12.48 0h-.96C6.089 0 3.374 0 1.687 1.687Zm2.363 5.613c.13 6.24 3.25 9.99 8.72 9.99h.31v-3.57c2.01.2 3.53 1.67 4.14 3.57h2.84c-.78-2.84-2.83-4.41-4.11-5.01 1.28-.74 3.08-2.54 3.51-4.98h-2.58c-.56 1.98-2.22 3.78-3.8 3.95v-3.95H10.5v7.92c-1.6-.4-3.62-2.34-3.71-6.92H4.05Z"
                        />
                      </svg>
                    </a>
                    <a href="https://max.ru/id2318035425_biz" class="dtel-soc-btn" rel="noopener noreferrer" aria-label="MAX">
                      <svg class="dtel-soc-btn__ico" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M12.258 23.932c-2.355 0-3.45-.346-5.353-1.727C5.702 23.759 1.89 24.973 1.725 22.895c0-1.56-.344-2.878-.734-4.317C.527 16.806 0 14.832 0 11.972 0 5.14 5.582 0 12.195 0 18.814 0 24 5.393 24 12.035c.01 3.14-1.22 6.157-3.421 8.387-2.202 2.231-5.194 3.493-8.321 3.51Zm.097-18.027c-3.22-.167-5.73 2.072-6.287 5.583-.458 2.907.356 6.446 1.05 6.63.332.081 1.169-.598 1.69-1.122.862.598 1.867.958 2.912 1.042 1.604.077 3.175-.48 4.374-1.553 1.199-1.073 1.931-2.576 2.039-4.185.063-1.613-.507-3.186-1.587-4.381-1.08-1.195-2.584-1.916-4.188-2.008v-.006Z"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div class="dtel-footer__contacts">
              <div class="dtel-fgroup">
                <p class="dtel-fgroup__title">Контакты</p>
                <p class="dtel-info-block__line">Сочи, ул. Виноградная, 20А (этаж 1)</p>
                <p class="dtel-info-block__line dtel-info-block__hours">09:00 — 18:00</p>
                <a class="dtel-info-block__line" href="tel:88622000000" rel="noopener noreferrer">+7 (862) 2–000–000</a>
                <a class="dtel-info-block__line dtel-info-block__email" href="mailto:client@dtel.ru" rel="noopener noreferrer"
                  >client@dtel.ru</a
                >
                <div class="dtel-info-block__social">
                  <a href="https://vk.ru/dtel_ru" class="dtel-soc-btn" rel="noopener noreferrer" aria-label="ВКонтакте">
                    <svg class="dtel-soc-btn__ico" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M1.687 1.687C0 3.374 0 6.089 0 11.52v.96c0 5.391 0 8.106 1.687 9.793C3.374 24 6.089 24 11.52 24h.96c5.431 0 8.146 0 9.833-1.687C24 20.626 24 17.911 24 12.48v-.96c0-5.391 0-8.106-1.687-9.833C20.626 0 17.911 0 12.48 0h-.96C6.089 0 3.374 0 1.687 1.687Zm2.363 5.613c.13 6.24 3.25 9.99 8.72 9.99h.31v-3.57c2.01.2 3.53 1.67 4.14 3.57h2.84c-.78-2.84-2.83-4.41-4.11-5.01 1.28-.74 3.08-2.54 3.51-4.98h-2.58c-.56 1.98-2.22 3.78-3.8 3.95v-3.95H10.5v7.92c-1.6-.4-3.62-2.34-3.71-6.92H4.05Z"
                      />
                    </svg>
                  </a>
                  <a href="https://max.ru/id2318035425_biz" class="dtel-soc-btn" rel="noopener noreferrer" aria-label="MAX">
                    <svg class="dtel-soc-btn__ico" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M12.258 23.932c-2.355 0-3.45-.346-5.353-1.727C5.702 23.759 1.89 24.973 1.725 22.895c0-1.56-.344-2.878-.734-4.317C.527 16.806 0 14.832 0 11.972 0 5.14 5.582 0 12.195 0 18.814 0 24 5.393 24 12.035c.01 3.14-1.22 6.157-3.421 8.387-2.202 2.231-5.194 3.493-8.321 3.51Zm.097-18.027c-3.22-.167-5.73 2.072-6.287 5.583-.458 2.907.356 6.446 1.05 6.63.332.081 1.169-.598 1.69-1.122.862.598 1.867.958 2.912 1.042 1.604.077 3.175-.48 4.374-1.553 1.199-1.073 1.931-2.576 2.039-4.185.063-1.613-.507-3.186-1.587-4.381-1.08-1.195-2.584-1.916-4.188-2.008v-.006Z"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="dtel-footer__bottom">
        <div class="dtel-footer__bottom-inner dtel-container dtel-container--footer-bot">
          <div class="dtel-footer__banks">
            <span class="dtel-bank-ico dtel-bank-ico--sbp" title="СберPay" />
            <span class="dtel-bank-ico dtel-bank-ico--alfa" title="Альфа-Банк" />
            <span class="dtel-bank-ico dtel-bank-ico--mir" title="МИР" />
            <span class="dtel-bank-ico dtel-bank-ico--tbank" title="Т-Банк" />
          </div>
          <p class="dtel-footer__copy">© ООО «Дагомыс телеком» 2008–2026.</p>
          <div class="dtel-footer__apps">
            <a
              class="dtel-app-btn"
              href="https://play.google.com/store/apps/details?id=ru.dtel.camera"
              rel="noopener noreferrer"
            >
              <span class="dtel-app-btn__ico dtel-app-btn__ico--android" aria-hidden="true" />
              <p class="dtel-app-btn__title">
                Загрузите на<br /><span class="dtel-app-btn__plat">Android</span>
              </p>
              <img :src="`${DTEL}/uploads/android_QR_06320e16e2.svg`" alt="" class="dtel-app-btn__qr" loading="lazy" />
            </a>
            <a
              class="dtel-app-btn"
              href="https://apps.apple.com/us/app/dtel-ru/id1432580592?l=ru"
              rel="noopener noreferrer"
            >
              <span class="dtel-app-btn__ico dtel-app-btn__ico--apple" aria-hidden="true" />
              <p class="dtel-app-btn__title">
                Загрузите на<br /><span class="dtel-app-btn__plat">iOS</span>
              </p>
              <img :src="`${DTEL}/uploads/ios_QR_e9c62ea06d.svg`" alt="" class="dtel-app-btn__qr" loading="lazy" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.dtel-below {
  background: var(--page-background);
  color: var(--gray-100);
}

.dtel-below__wrap {
  margin: 0 auto;
  max-width: var(--max-width);
}

/* ——— links grid ——— */
.dtel-links-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
}

@media (max-width: 1024px) {
  .dtel-links-grid {
    grid-template-columns: 1fr;
  }
}

.dtel-block-link {
  position: relative;
  display: grid;
  grid-template-rows: 1fr auto 1fr;
  gap: 60px;
  justify-items: center;
  min-height: max(calc(100vh - 100px), 550px);
  padding: var(--offset-side-desktop);
  overflow: hidden;
  width: 100%;
  background: #0a0a0a;
  color: inherit;
  --dtel-overlay: 0.2;
}

.dtel-block-link:hover {
  --dtel-overlay: 0.7;
}

.dtel-block-link__hit {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.dtel-block-link__bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.dtel-block-link__bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background: #0a0a0a;
  opacity: var(--dtel-overlay);
  transition: opacity 0.3s ease;
}

.dtel-block-link__bg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

.dtel-block-link__header {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  justify-self: stretch;
  width: 100%;
}

.dtel-block-link__header-text,
.dtel-block-link__pay {
  font-family: var(--font-body);
  font-size: 11px;
  letter-spacing: 0.4px;
  line-height: 18px;
  font-weight: 500;
  text-transform: uppercase;
  color: #fff;
}

.dtel-block-link__pay {
  position: relative;
  z-index: 3;
  text-decoration: none;
  border-bottom: 1px solid transparent;
}

.dtel-block-link__pay:hover {
  border-bottom-color: #fff;
}

.dtel-block-link__title {
  position: relative;
  z-index: 2;
  margin: 0;
  font-family: var(--font-display);
  font-size: 80px;
  font-weight: 500;
  letter-spacing: 2.15px;
  line-height: 80px;
  max-width: 676px;
  text-align: center;
  text-transform: uppercase;
  color: #fff;
}

.dtel-block-link__title-inner {
  background-image: linear-gradient(currentColor, currentColor);
  background-position: 0 100%;
  background-repeat: no-repeat;
  background-size: 0% 1px;
  transition: background-size 0.3s ease-in-out;
  padding-bottom: 2px;
}

.dtel-block-link:hover .dtel-block-link__title-inner {
  background-size: 100% 1px;
}

.dtel-block-link__footer {
  position: relative;
  z-index: 2;
  align-self: end;
  justify-self: stretch;
  display: flex;
  align-items: flex-end;
}

.dtel-block-link__desc {
  margin: 0;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.3px;
  line-height: 22px;
  color: #fff;
}

/* ——— sections ——— */
.dtel-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 0 var(--offset-side-desktop);
}

.dtel-sections--mobile {
  display: none;
}

.dtel-section--left {
  border-right: 1px solid #cecece;
}

.dtel-section {
  padding: 40px 0 80px;
}

.dtel-section--left {
  padding-right: var(--offset-side-desktop);
}

.dtel-section--right {
  padding-left: var(--offset-side-desktop);
}

.dtel-section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 40px;
}

.dtel-section__more {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.3px;
  line-height: 22px;
  color: #6c6c6c;
  text-decoration: none;
}

.dtel-section__more:hover {
  color: #0a0a0a;
}

.dtel-section__body {
  margin: 0;
  max-width: 620px;
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.3px;
  line-height: 24px;
  color: #0a0a0a;
}

.dtel-news-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(2, 1fr);
}

.dtel-subtitle {
  margin: 0;
  text-transform: uppercase;
  color: #0a0a0a;
  font-family: var(--font-display);
  font-weight: 500;
}

.dtel-subtitle--h2 {
  font-size: 80px;
  letter-spacing: 2.15px;
  line-height: 80px;
  margin-bottom: 40px;
}

.dtel-subtitle--h3 {
  font-size: 54px;
  letter-spacing: 1.6px;
  line-height: 54px;
}

.dtel-article-card {
  border: 1px solid #cecece;
  display: flex;
  flex-direction: column;
  padding: 40px;
  text-decoration: none;
  color: inherit;
}

.dtel-article-card:hover {
  border-color: #3b3b3b;
  outline: 1px solid #3b3b3b;
  outline-offset: -1px;
}

.dtel-article-card__img-wrap {
  margin-bottom: 24px;
}

.dtel-article-card__img-wrap img {
  width: 100%;
  aspect-ratio: 278 / 240;
  max-height: 240px;
  object-fit: cover;
  display: block;
}

.dtel-article-card__date {
  margin: 0 0 12px;
  font-family: var(--font-body);
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.05px;
  line-height: 16px;
  text-transform: uppercase;
  color: #9d9d9d;
}

.dtel-article-card__title {
  margin: 0;
  flex: 1;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.3px;
  line-height: 22px;
  text-transform: uppercase;
  color: #0a0a0a;
}

/* ——— payment ——— */
.dtel-container {
  margin: 0 auto;
  max-width: var(--max-width);
  padding: var(--offset-top-desktop) var(--offset-side-desktop) var(--offset-bottom-desktop);
}

.dtel-payment__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 46px 40px;
  margin-bottom: 60px;
}

.dtel-field {
  position: relative;
}

.dtel-field__label {
  display: block;
  margin-bottom: 8px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: #0a0a0a;
}

.dtel-field__input {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #cecece;
  font-family: var(--font-body);
  font-size: 13px;
  background: #fff;
}

.dtel-field__input:focus {
  outline: none;
  border-color: var(--blue-default);
}

.dtel-field__err {
  margin: 8px 0 0;
  font-size: 11px;
  color: var(--system-red);
}

.dtel-field--ok .dtel-field__err {
  display: none;
}

.dtel-payment__actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-areas:
    'sbp card'
    'text-first text-second';
  gap: 40px 20px;
  max-width: calc(50% - 20px);
  margin: 0 auto;
}

.dtel-btn {
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.4px;
  line-height: 18px;
  text-transform: uppercase;
  padding: 19px 20px;
  border: none;
  cursor: not-allowed;
}

.dtel-btn--blue {
  background: var(--blue-default);
  color: #fff;
  opacity: 0.4;
}

.dtel-payment__actions .dtel-btn:first-of-type {
  grid-area: sbp;
}

.dtel-payment__actions .dtel-btn:last-of-type {
  grid-area: card;
}

.dtel-payment__note--first {
  grid-area: text-first;
}

.dtel-payment__note-wrap {
  grid-area: text-second;
}

.dtel-payment__note {
  margin: 0;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.4px;
  line-height: 18px;
  color: #9d9d9d;
}

.dtel-payment__note-wrap .dtel-payment__note:not(:last-child) {
  margin-bottom: 12px;
}

.dtel-underline {
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* ——— footer ——— */
.dtel-footer {
  background: #0a0a0a;
}

.dtel-container--footer-top {
  padding-top: 40px;
  padding-bottom: 30px;
}

.dtel-footer__grid {
  display: grid;
  grid-template-columns: 150px 1fr 280px;
  column-gap: 20px;
  align-items: start;
}

.dtel-footer__scene {
  width: 150px;
  height: 150px;
  background: #0a0a0a;
}

.dtel-footer__nav {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-areas:
    'company products'
    'info service';
  gap: 0 20px;
}

.dtel-footer__nav-cell--company {
  grid-area: company;
}

.dtel-footer__nav-cell--products {
  grid-area: products;
}

.dtel-footer__nav-cell--info {
  grid-area: info;
}

.dtel-footer__nav-cell--service {
  grid-area: service;
}

.dtel-footer__nav-cell--contacts-tab {
  display: none;
  grid-area: contacts;
}

.dtel-fgroup__title {
  color: hsla(0, 0%, 100%, 0.6);
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.4px;
  line-height: 18px;
  margin: 0 0 20px;
  text-transform: uppercase;
}

.dtel-fgroup--margin {
  margin-bottom: 40px;
}

.dtel-fgroup__links {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.dtel-fgroup__links a {
  color: #fff;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.4px;
  line-height: 18px;
  text-transform: uppercase;
  text-decoration: none;
}

.dtel-fgroup__links a:hover {
  color: hsla(0, 0%, 100%, 0.6);
}

.dtel-fgroup__links--large a {
  font-size: 11px;
}

.dtel-info-block__line {
  display: block;
  margin: 0 0 4px;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.3px;
  line-height: 22px;
  color: #fff;
  text-decoration: none;
}

.dtel-info-block__hours {
  margin-bottom: 20px;
}

.dtel-info-block__email {
  margin-bottom: 30px;
}

.dtel-info-block__social {
  display: flex;
  gap: 12px;
}

.dtel-soc-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: #0f0f0f;
  color: #fff;
  text-decoration: none;
}

.dtel-soc-btn:hover {
  background: #1e1e1e;
}

.dtel-soc-btn__ico {
  display: block;
  flex-shrink: 0;
}

.dtel-footer__bottom {
  margin-top: -76px;
}

.dtel-container--footer-bot {
  display: grid;
  grid-template-columns: 1fr 300px 1fr;
  grid-template-areas: 'left center right';
  gap: 20px;
  align-items: flex-end;
  padding-bottom: 40px;
}

.dtel-footer__banks {
  grid-area: left;
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: center;
}

.dtel-bank-ico {
  display: block;
  opacity: 0.35;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.dtel-bank-ico--sbp {
  width: 58px;
  height: 28px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 58 28'%3E%3Cpath fill='%23fff' d='M16 1h26c8 0 15 6 15 13s-7 13-15 13H16C8 27 1 21 1 14S8 1 16 1z'/%3E%3C/svg%3E");
}

.dtel-bank-ico--alfa {
  width: 19px;
  height: 30px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 19 30'%3E%3Cpath fill='%23fff' d='M9.5 0L18 18H12l-1.5-4H8L6.5 18H1L9.5 0zm0 22h7v8h-7v-8z'/%3E%3C/svg%3E");
}

.dtel-bank-ico--mir {
  width: 58px;
  height: 16px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 58 16'%3E%3Crect fill='%23fff' width='58' height='16' rx='2'/%3E%3C/svg%3E");
}

.dtel-bank-ico--tbank {
  width: 40px;
  height: 12px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 12'%3E%3Cpath fill='%23fff' d='M0 0h14v12H0V0zm18 0h22v3H18V0zm0 5h16v2H18V5zm0 4h20v3H18V9z'/%3E%3C/svg%3E");
}

.dtel-footer__copy {
  grid-area: center;
  margin: 0 0 8px;
  text-align: center;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.3px;
  line-height: 22px;
  color: hsla(0, 0%, 100%, 0.2);
}

.dtel-footer__apps {
  grid-area: right;
  justify-self: end;
  display: flex;
  gap: 12px;
}

.dtel-app-btn {
  display: block;
  width: 130px;
  padding: 24px 20px 20px;
  background: #0f0f0f;
  text-decoration: none;
  text-align: center;
}

.dtel-app-btn:hover {
  background: #1e1e1e;
}

.dtel-app-btn__title {
  margin: 0;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.3px;
  line-height: 22px;
  color: hsla(0, 0%, 100%, 0.6);
}

.dtel-app-btn__plat {
  color: #fff;
}

.dtel-app-btn__qr {
  display: block;
  width: 90%;
  max-width: 90px;
  height: auto;
  margin: 20px auto 0;
}

.dtel-app-btn__ico {
  display: block;
  width: 30px;
  height: 30px;
  margin: 0 auto 20px;
  background: #fff;
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
}

.dtel-app-btn__ico--android {
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 31 18'%3E%3Cpath fill='black' d='M8 1L6 4h19l-2-3H8zm-3 5h26v12H5V6z'/%3E%3C/svg%3E");
}

.dtel-app-btn__ico--apple {
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 30'%3E%3Cpath fill='black' d='M18 15c0-4 2-7 5-9-2-3-6-4-9-3-3 1-5 3-5 3s-2-2-5-3c-3-1-7 0-9 3 5 3 5 9 5 9s-1 6-5 9c2 3 6 4 9 3 3-1 5-3 5-3s2 2 5 3c3 1 7 0 9-3-4-3-5-9-5-9z'/%3E%3C/svg%3E");
}

@media (max-width: 1150px) {
  .dtel-payment__actions {
    max-width: 100%;
  }
}

@media (max-width: 1024px) {
  .dtel-block-link {
    min-height: 600px;
    padding: var(--offset-side-tablet);
    gap: 20px;
  }

  .dtel-block-link__header-text,
  .dtel-block-link__pay {
    font-size: 13px;
    letter-spacing: 0.3px;
    line-height: 22px;
  }

  .dtel-block-link__title {
    font-size: 54px;
    letter-spacing: 1.6px;
    line-height: 54px;
  }

  .dtel-block-link__desc {
    font-size: 15px;
    line-height: 24px;
  }

  .dtel-sections--desktop {
    display: none;
  }

  .dtel-sections--mobile {
    display: block;
    padding: 50px var(--offset-side-tablet) 70px;
  }

  .dtel-section--left {
    border-right: none;
  }

  .dtel-section {
    padding: 0;
  }

  .dtel-section:first-child {
    margin-bottom: 70px;
  }

  .dtel-section__head {
    margin-bottom: 30px;
    padding: 0 var(--offset-side-tablet);
  }

  .dtel-section--news-m .dtel-section__head {
    padding: 0 var(--offset-side-tablet);
  }

  .dtel-section__more {
    font-size: 15px;
    line-height: 24px;
  }

  .dtel-section__body {
    padding: 0 var(--offset-side-tablet);
  }

  .dtel-article-card {
    padding: 30px;
    margin: 0 var(--offset-side-tablet);
  }

  .dtel-article-card__img-wrap img {
    aspect-ratio: 340 / 294;
    max-height: none;
  }

  .dtel-article-card__date {
    font-size: 11px;
    letter-spacing: 0.4px;
    line-height: 18px;
  }

  .dtel-article-card__title {
    font-size: 15px;
    line-height: 24px;
  }

  .dtel-subtitle--h2 {
    font-size: 54px;
    letter-spacing: 2px;
    line-height: 54px;
  }

  .dtel-subtitle--h3 {
    font-size: 50px;
    letter-spacing: 1.3px;
    line-height: 50px;
  }

  .dtel-container {
    padding: var(--offset-top-tablet) var(--offset-side-tablet) var(--offset-bottom-tablet);
  }

  .dtel-payment__grid {
    grid-template-columns: 1fr;
    gap: 24px;
    margin-bottom: 50px;
  }

  .dtel-payment__actions {
    grid-template-columns: 1fr;
    grid-template-areas: 'sbp' 'card' 'text-first' 'text-second';
    gap: 0;
  }

  .dtel-payment__actions .dtel-btn:first-of-type {
    margin-bottom: 20px;
  }

  .dtel-payment__actions .dtel-btn:last-of-type {
    margin-bottom: 30px;
  }

  .dtel-payment__note--first {
    margin-bottom: 12px;
  }

  .dtel-payment__note {
    font-size: 13px;
    letter-spacing: 0.3px;
    line-height: 22px;
  }

  .dtel-footer__grid {
    grid-template-columns: 1fr;
  }

  .dtel-footer__scene {
    width: 120px;
    height: 120px;
    margin-bottom: 70px;
  }

  .dtel-footer__nav {
    grid-template-columns: repeat(3, 1fr);
    grid-template-areas:
      'products company info'
      'service contacts .';
    margin-bottom: 60px;
  }

  .dtel-footer__nav-cell--contacts-tab {
    display: block;
  }

  .dtel-footer__contacts {
    display: none;
  }

  .dtel-fgroup--margin {
    margin-bottom: 60px;
  }

  .dtel-fgroup__links a,
  .dtel-fgroup__links--large a {
    font-size: 13px;
    letter-spacing: 0.3px;
    line-height: 22px;
  }

  .dtel-info-block__line {
    font-size: 15px;
    line-height: 24px;
  }

  .dtel-footer__bottom {
    margin-top: -120px;
  }

  .dtel-container--footer-bot {
    grid-template-columns: 1fr 274px;
    grid-template-areas:
      'center right'
      'left right';
    align-items: start;
  }

  .dtel-footer__copy {
    text-align: left;
    font-size: 15px;
    line-height: 24px;
    margin-bottom: 6px;
  }

  .dtel-footer__apps {
    width: 100%;
    flex-direction: column;
  }

  .dtel-app-btn {
    width: 100%;
    max-width: 164px;
  }

  .dtel-app-btn__title {
    font-size: 15px;
    line-height: 24px;
  }

  .dtel-app-btn__qr {
    display: none;
  }
}

@media (max-width: 810px) {
  .dtel-block-link {
    padding: 30px var(--offset-side-mobile);
  }

  .dtel-block-link__title {
    font-size: 50px;
    letter-spacing: 1.3px;
    line-height: 50px;
  }

  .dtel-sections--mobile {
    padding-left: var(--offset-side-mobile);
    padding-right: var(--offset-side-mobile);
  }

  .dtel-section__head {
    padding: 0 var(--offset-side-mobile);
  }

  .dtel-section--news-m .dtel-section__head {
    padding: 0 var(--offset-side-mobile);
  }

  .dtel-section__body {
    padding: 0 var(--offset-side-mobile);
  }

  .dtel-article-card {
    margin: 0 var(--offset-side-mobile);
  }

  .dtel-container {
    padding-left: var(--offset-side-mobile);
    padding-right: var(--offset-side-mobile);
  }

  .dtel-subtitle--h2,
  .dtel-subtitle--h3 {
    font-size: 50px;
    letter-spacing: 1.3px;
    line-height: 50px;
  }

  .dtel-footer__nav {
    grid-template-columns: repeat(2, 1fr);
    grid-template-areas:
      'products company'
      'info service';
  }

  .dtel-footer__nav-cell--contacts-tab {
    display: none;
  }

  .dtel-footer__contacts {
    display: block;
  }

  .dtel-container--footer-bot {
    grid-template-columns: 1fr;
    grid-template-areas: 'right' 'center' 'left';
    gap: 60px;
    justify-items: center;
  }

  .dtel-footer__copy {
    text-align: center;
  }

  .dtel-footer__banks,
  .dtel-footer__apps {
    justify-content: center;
  }

  .dtel-footer__apps {
    flex-direction: row;
  }

  .dtel-footer__bottom {
    margin-top: 0;
  }
}

@media (max-width: 352px) {
  .dtel-footer__nav {
    grid-template-columns: 1fr;
    grid-template-areas: 'products' 'company' 'info' 'service';
    gap: 60px;
  }

  .dtel-fgroup--margin {
    margin-bottom: 0;
  }
}
</style>
