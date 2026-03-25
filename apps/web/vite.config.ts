import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react() as unknown as PluginOption],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@todo-list-pro/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
