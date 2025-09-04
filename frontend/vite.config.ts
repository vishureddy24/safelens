import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ mode }) => ({
  base: '/',
  server: mode === 'development' ? {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    open: true,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) => path.replace(/^\/api/, '')
      }
    }
  } : undefined,
  preview: {
    port: 5173,
    strictPort: true,
  },
  plugins: [
    react(),
    nodePolyfills({
      include: ['path', 'crypto', 'stream', 'util', 'buffer'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
    mode === 'development' ? componentTagger() : null,
  ].filter(Boolean) as PluginOption[],
  define: {
    global: 'globalThis'
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      transformMixedEsModules: true,
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}));
