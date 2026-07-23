import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Force all packages to use the single React instance from node_modules/react
    // This fixes the "Invalid hook call" error from @supabase/auth-ui-react
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@supabase/auth-ui-react',
      '@supabase/auth-ui-shared',
      '@supabase/supabase-js',
    ],
  },
})
