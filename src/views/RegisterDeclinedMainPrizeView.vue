<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="complete">
    <div class="complete__card">
      <div class="complete__icon" aria-hidden="true">✓</div>
      <h1 class="complete__title">Всё прошло успешно</h1>
      <p class="complete__text">
        Регистрация в беспроигрышной части корпоративного розыгрыша завершена. Ваш номер участника сохранён — если он
        выпадет в эфире, вы гарантированно получаете приз из базовой категории.
      </p>
      <p class="complete__hint">
        Вы отказались от дополнительного этапа с главным призом — это не влияет на вашу участь в основной программе.
        Желаем успехов в работе и отличного настроения на дне компании!
      </p>
      <RouterLink to="/" class="complete__btn">На главную</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.complete {
  min-height: calc(100dvh - var(--header-height));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 20px 72px;
  background: var(--page-background, #f9fafb);
}

.complete__card {
  max-width: 480px;
  text-align: center;
  padding: 48px 40px;
  background: #fff;
  border: 1px solid #e8e8ea;
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
