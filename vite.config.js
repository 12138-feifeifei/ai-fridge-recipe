import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // 本地开发想直连后端又不想处理跨域时：在 .env.local 里设 VITE_DEV_PROXY_TARGET
  const proxyTarget = env.VITE_DEV_PROXY_TARGET?.trim()
  const devProxy = proxyTarget
    ? {
        proxy: {
          '/api': {
            target: proxyTarget,
            changeOrigin: true,
          },
        },
      }
    : {}

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
      port: 5173,
      ...devProxy,
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  }
})
