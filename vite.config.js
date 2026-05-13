import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: true, // SỬA Ở ĐÂY: Dùng true (không có dấu nháy) để mở khóa cho mọi Host
    cors: true,
    hmr: {
      clientPort: 443,
    },
  }
})