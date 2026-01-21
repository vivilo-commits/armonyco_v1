import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, 'src', '');

  return {
    envDir: 'src',
    plugins: [
      tailwindcss(),
      react()
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    build: {
      outDir: 'src/dist',
    },
    resolve: {
      alias: [
        { find: '@', replacement: path.resolve(__dirname, 'src') }
      ],
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path) => path
        }
      }
    },
  };
});
