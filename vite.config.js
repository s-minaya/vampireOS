import { defineConfig } from 'vite';

// GitHub Pages serves this project at https://<user>.github.io/vampireOS/ (the path is
// case-sensitive), so every built asset URL must be prefixed with the repository name.
export default defineConfig({
  base: '/vampireOS/',
});
