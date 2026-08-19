import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'productsMfe',
      filename: 'remoteEntry.js',
      exposes: {
        './ProductList': './src/ProductList.jsx',
        './ProductDetail': './src/ProductDetail.jsx',
      },
      shared: ['react', 'react-dom', 'react-router-dom'],
    }),
  ],
  build: {
    target: 'esnext',
  },
});
