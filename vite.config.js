import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// 部署到 GitHub Pages 時，將 base 改為 '/<repo-name>/'
// 例如：base: '/yile-gcal-freebusy/'
export default defineConfig({
  plugins: [react()],
  base: '/yile-gcal-freebusy/',
})
