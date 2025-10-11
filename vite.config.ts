import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages project site
  // Repo: markdias/shut_thebox -> https://markdias.github.io/shut_thebox/
  base: '/shut_thebox/',
  server: {
    port: 5173
  }
});
