import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

declare const process: {
  cwd: () => string
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env sources regardless of prefix.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx']
    },
    server: {
      port: 8000,
      allowedHosts: ['drive.duckq1linux.id.vn'],
      watch: {
        ignored: ['**/.venv/**']
      },
      proxy: {
        // Proxy cho backend API chính (user auth, notes, etc.)
        '/api': {
          target: env.VITE_BE_BASE_URL || 'http://localhost:8550',
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path
        },
        // Proxy cho n8n webhooks (AI chat, quiz generation, etc.)
        '/n8n': {
          // target: 'https://duckq1-n8n.duckdns.org',
          target: 'http://n8n.duckq1linux.id.vn',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/n8n/, '')
        }
      }
    }
  }
})
