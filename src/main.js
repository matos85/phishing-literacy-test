import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { logRouteEvent } from './lib/sessionEvents'

router.afterEach((to) => {
  setTimeout(() => {
    void logRouteEvent(to.fullPath)
  }, 0)
})

createApp(App).use(router).mount('#app')
