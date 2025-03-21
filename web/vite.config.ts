import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsConfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig(() => {
  const port = process.env.VITE_PORT;

  if (!port) {
    throw new Error('VITE_PORT is not set');
  }

  return {
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, '../shared'),
      },
    },
    plugins: [react(), tsConfigPaths()],
    server: {
      host: '0.0.0.0',
      port: parseInt(port),
    },
    envDir: './',
    envPrefix: 'VITE_',
  };
});
