import { createApp } from 'vue'
import '@fontsource/manrope/cyrillic-500.css'
import '@fontsource/manrope/cyrillic-600.css'
import '@fontsource/manrope/latin-500.css'
import '@fontsource/manrope/latin-600.css'
import './style.css'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
