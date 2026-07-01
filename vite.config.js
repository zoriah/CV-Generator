import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src',
  server: {
    port: 3000,
    hmr: true,
  },
  build: {
    outDir: '../dist'
  }
})
