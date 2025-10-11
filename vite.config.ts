import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages project site
  // Repo: markdias/shut_thebox -> https://markdias.github.io/shut_thebox/
  base: '/shut_thebox/',
  define: {
    __APP_VERSION__: JSON.stringify(process.env.VITE_APP_VERSION ?? pkg.version)
  },
  server: {
    port: 5173
  }
});
