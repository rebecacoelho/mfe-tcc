import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // URLs públicas dos remotes em produção; localhost para dev/preview local
  const productsMfeUrl = env.VITE_PRODUCTS_MFE_URL || 'http://localhost:5001';
  const cartMfeUrl = env.VITE_CART_MFE_URL || 'http://localhost:5002';

  return {
    plugins: [
      react(),
      federation({
        name: 'shell',
        remotes: {
          productsMfe: `${productsMfeUrl}/assets/remoteEntry.js`,
          cartMfe: `${cartMfeUrl}/assets/remoteEntry.js`,
        },
        shared: ['react', 'react-dom', 'react-router-dom'],
      }),
    ],
    build: {
      target: 'esnext',
    },
  };
});
