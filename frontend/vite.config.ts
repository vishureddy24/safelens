import { defineConfig, type UserConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const config: UserConfig = {
    base: '/',
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,
      open: true,
      proxy: {
        '/api': {
          target: process.env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          rewrite: (path: string) => path.replace(/^\/api/, '')
        },
      },
    },
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
    ].filter(Boolean) as any[],
    define: {
      'process.env': {}
    },
    build: {
      target: 'esnext',
      rollupOptions: {
        external: ['jspdf'],
        output: {
          manualChunks: {
            jspdf: ['jspdf']
          }
        }
      }
    },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };

  return config;
});
