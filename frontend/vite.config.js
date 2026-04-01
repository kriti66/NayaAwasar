import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on all interfaces so localhost / 127.0.0.1 / LAN work reliably on Windows
    host: true,
    port: 5173,
    strictPort: false,
    // OneDrive Desktop paths can break native file watchers; polling avoids stale or dropped HMR
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
})
