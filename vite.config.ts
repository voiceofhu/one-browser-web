import path from 'node:path';
import { createRequire } from 'node:module';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const require = createRequire(import.meta.url);
const pkg = require('./package.json') as {
  appName?: string;
  name: string;
  version: string;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxyTarget = env.VITE_DEV_BACKEND_URL || 'http://127.0.0.1:27514';
  const appName = env.VITE_APP_NAME || pkg.appName || pkg.name;
  const appVersion = env.VITE_APP_VERSION?.trim() || pkg.version;
  const buildTime = env.VITE_BUILD_TIME?.trim() || new Date().toISOString();
  const buildId = `${appVersion}:${buildTime}`;

  return {
    base: env.VITE_BASE_URL || '/',
    define: {
      __APP_BUILD_TIME__: JSON.stringify(buildTime),
      __APP_VERSION__: JSON.stringify(appVersion),
      __APP_BUILD_ID__: JSON.stringify(buildId),
      'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildTime),
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'html-app-name',
        generateBundle() {
          this.emitFile({
            type: 'asset',
            fileName: 'app-version.json',
            source: JSON.stringify({ build: buildTime }),
          });
        },
        transformIndexHtml: (html) => html.replaceAll('%APP_NAME%', appName),
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    server: {
      host: '127.0.0.1',
      port: 27515,
      strictPort: true,
      allowedHosts: ['one-browser-web.marseo.eu.org'],
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
        '/healthz': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
        '/docs': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
        '/openapi.json': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
