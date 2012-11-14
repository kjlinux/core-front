import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import '@/assets/css/main.css'

// Setup mock if enabled
if (import.meta.env.VITE_USE_MOCK === 'true') {
  import('./services/mock').then(({ setupMock }) => setupMock())
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
