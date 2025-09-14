import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ['@google/genai'],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  define: {
    // Expose Supabase env vars to the client. This uses the variable names you provided.
    'import.meta.env.VITE_SUPABASE_DATABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_DATABASE_URL || process.env.SUPABASE_DATABASE_URL),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY),
  }
})