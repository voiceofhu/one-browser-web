import path from "path"
import { createRequire } from "node:module"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

const require = createRequire(import.meta.url)
const pkg = require("./package.json") as { appName?: string; name: string }

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const buildTime = new Date().toISOString()
  const apiProxyTarget = env.API_PROXY_TARGET || "http://127.0.0.1:27512"
  const appName = env.VITE_APP_NAME || pkg.appName || pkg.name

  return {
    define: {
      __APP_BUILD_TIME__: JSON.stringify(buildTime),
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "html-app-name",
        transformIndexHtml: (html) => html.replaceAll("%APP_NAME%", appName),
      },
    ],
    server: {
      host: "127.0.0.1",
      port: 27513,
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
        },
        "/healthz": {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
      strictPort: true,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})
