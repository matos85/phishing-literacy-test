<script setup>
import { onMounted } from 'vue'
import AppHeader from './components/AppHeader.vue'
import AdminSessionBar from './components/AdminSessionBar.vue'
import { RouterView } from 'vue-router'
import { adminLoggedIn, syncAdminSession } from './composables/useAdminSession'

onMounted(() => {
  syncAdminSession()
})
</script>

<template>
  <div class="page" :class="{ 'page--admin-session': adminLoggedIn }">
    <AppHeader v-if="!adminLoggedIn" />
    <AdminSessionBar v-if="adminLoggedIn" />
    <main class="main" :class="{ 'main--admin-session': adminLoggedIn }">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100dvh;
}

.page--admin-session {
  --header-height: var(--admin-session-bar-height);
  --header-height-mobile: var(--admin-session-bar-height);
}

.main {
  padding-top: var(--header-height);
}

.main--admin-session {
  padding-top: var(--admin-session-bar-height);
}

@media (max-width: 1024px) {
  .main:not(.main--admin-session) {
    padding-top: var(--header-height-mobile);
  }
}
</style>
