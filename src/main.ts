import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart, GaugeChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components'

import App from './App.vue'
import router from './router'
import '@/assets/css/main.css'
import { useAuthStore } from '@/stores/auth.store'

// Register ECharts components globally once
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  GaugeChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
])

async function bootstrap() {
  // Setup mock before mounting so all handlers are registered first
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    const { setupMock } = await import('./services/mock')
    setupMock()
  }

  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(router)

  // Hydrate auth store from localStorage before first navigation guard runs
  const authStore = useAuthStore()
  authStore.loadFromStorage()

  // Initialize Echo for real-time WebSocket if user is authenticated
  if (authStore.isAuthenticated) {
    const { initEcho } = await import('./services/echo')
    initEcho()
  }

  app.mount('#app')
}

bootstrap()
