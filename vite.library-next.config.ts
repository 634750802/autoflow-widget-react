import react from '@vitejs/plugin-react-swc';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import packageInfo from './package.json';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer(),
  ],
  build: {
    outDir: 'dist/next',
    lib: {
      entry: 'src/library-next.ts',
      fileName: `library`,
      formats: ['es'],
    },
    minify: false,
    rollupOptions: {
      external: [
        ...Object.keys(packageInfo.peerDependencies),
        /^react\//,
        /^react-dom\//,
        /^zustand\//,
        /^@wooorm\/starry-night\/lib/,
        /^@wooorm\/starry-night\/lang/,
      ],
    },
  },
});
