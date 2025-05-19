import react from '@vitejs/plugin-react-swc';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import packageInfo from './package.json';

const peerExternals = [
  'react-dom',
  'react',
  'zod',
  'zustand',
] as const;

const externals = [
  'tailwind-merge',
] as const;

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer(),
  ],
  build: {
    outDir: 'public',
    lib: {
      entry: 'src/standalone.tsx',
      fileName: () => `widget.js`,
      formats: ['es'],
    },
  },
  resolve: {
    alias: [
      { find: /^@wooorm\/starry-night$/, replacement: `https://esm.sh/@wooorm/starry-night@${packageInfo.devDependencies['@wooorm/starry-night']}?bundle=true` },
      ...peerExternals.map(pkg => ({
        find: pkg,
        replacement: `https://esm.sh/${pkg}@${packageInfo.peerDependencies[pkg]}`,
      })),
      ...externals.map(pkg => ({
        find: pkg,
        replacement: `https://esm.sh/${pkg}@${packageInfo.dependencies[pkg]}`,
      })),
    ],
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  server: {
    port: 3000,
  },
});
