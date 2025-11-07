import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        onlineapplication: resolve(__dirname, 'onlineapplication.html'),
        schengen: resolve(__dirname, 'schengen.html'),
        canada: resolve(__dirname, 'canada.html')
      }
    }
  }
})