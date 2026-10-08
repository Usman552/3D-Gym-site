import { defineConfig } from 'vite';

export default defineConfig({
  // relative base so the build works under GitHub Pages' /3D-Gym-site/ path
  base: './',
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        // three.js and gsap get their own long-cacheable chunks
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/gsap')) return 'gsap';
        },
      },
    },
  },
});
