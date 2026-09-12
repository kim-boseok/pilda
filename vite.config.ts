import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages 하위 경로(/pilda/)에서도 동작하도록 상대 경로 사용
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      // 공공데이터포털 API는 CORS를 허용하지 않아 개발 서버가 대신 호출
      '/api/khoa': {
        target: 'https://apis.data.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/khoa/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin')
            proxyReq.removeHeader('referer')
          })
        },
      },
    },
  },
})
