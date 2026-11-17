import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const versao = (process.env.CF_PAGES_COMMIT_SHA || 'local').slice(0, 7)

export default defineConfig({
  plugins: [react()],
  define: { __VERSAO__: JSON.stringify(versao) },
})
