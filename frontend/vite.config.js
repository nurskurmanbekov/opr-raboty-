import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Слушать на всех сетевых интерфейсах (0.0.0.0)
    port: 5173, // Порт dev сервера
    strictPort: false, // Использовать другой порт если 5173 занят
  },
  preview: {
    host: true, // Для preview build тоже
    port: 4173,
  }
})
