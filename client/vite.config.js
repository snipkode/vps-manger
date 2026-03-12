import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'eruda-inject',
      transformIndexHtml(html) {
        return html.replace(
          '</head>',
          `<!-- Eruda Console for Debugging -->
    <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
    <script>
      window.addEventListener('load', function() {
        if (typeof eruda !== 'undefined') {
          try {
            eruda.init();
            eruda.show();
          } catch(e) {
            console.error('Eruda init error:', e);
          }
        }
      });
    </script>
  </head>`
        )
      }
    }
  ],
  base: '/',
  build: {
    outDir: 'build',
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    port: 3002,
    host: '0.0.0.0',
    allowedHosts: ['perumdati.tech', 'localhost', '127.0.0.1'],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
