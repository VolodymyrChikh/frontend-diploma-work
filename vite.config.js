import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '..', '')
  const backendTarget = env.VITE_DEV_API_PROXY_TARGET || `http://127.0.0.1:${env.PORT || '9000'}`
  const scheduleTarget = env.VITE_SCHEDULE_DEV_API_PROXY_TARGET || 'http://127.0.0.1:9001'
  const apiProxy = {
    target: backendTarget,
    changeOrigin: true,
  }
  const scheduleProxy = {
    target: scheduleTarget,
    changeOrigin: true,
  }

  return {
    envDir: '..',
    plugins: [tailwindcss(), react()],
    server: {
      port: 3000,
      proxy: {
        '/parse-schedule': scheduleProxy,
        '/api': apiProxy,
        '/ai': apiProxy,
        '/auth': apiProxy,
        '/categories': apiProxy,
        '/comments': apiProxy,
        '/faqs': apiProxy,
        '/notifications': apiProxy,
        '/posts': apiProxy,
        '/specialties': apiProxy,
        '/subjects': apiProxy,
        '/users': apiProxy,
      },
    },
  }
})
