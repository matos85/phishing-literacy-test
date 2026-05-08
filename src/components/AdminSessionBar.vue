<script setup>
import { adminLogout } from '../composables/useAdminSession'

async function onExit() {
  await adminLogout()
}
</script>

<template>
  <header class="admin-session-bar" aria-label="Сессия администратора">
    <button type="button" class="admin-session-bar__exit" @click="onExit">Выход</button>
  </header>
</template>

<style scoped>
.admin-session-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--admin-session-bar-height, 48px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid #e0e0e2;
  box-shadow: 0 2px 12px rgba(10, 22, 47, 0.06);
}

.admin-session-bar__exit {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  padding: 10px 16px;
  cursor: pointer;
  border: 1px solid var(--blue-default);
  background: #fff;
  color: var(--blue-default);
  transition: background 0.2s, color 0.2s;
}

.admin-session-bar__exit:hover {
  background: #f3f6fc;
}
</style>
