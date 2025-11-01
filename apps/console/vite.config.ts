import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

const config = defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  optimizeDeps: {
    exclude: ['@google-cloud/cloudbuild', '@google-cloud/storage'],
  },
  server: {
    // Allow local development requests from our custom domain
    allowedHosts: ['consolelocalweb.riverly.tech'],
  },
  // ssr: {
  //   external: ['@google-cloud/cloudbuild', '@google-cloud/storage'],
  // },
})

export default config
