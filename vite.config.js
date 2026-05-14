import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: true, // Cho phép mọi Host (Ngrok/Localtonet) truy cập
    cors: true,
    hmr: {
      // THAY THẾ clientPort: 443 BẰNG 3 DÒNG NÀY:
      host: 'localhost',
      protocol: 'ws',
      port: 5173,
    },
  }
})