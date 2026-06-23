import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const buildTime = new Date().toISOString()
  const apiProxyTarget = env.API_PROXY_TARGET || "http://127.0.0.1:27512"

  return {
    define: {
      __APP_BUILD_TIME__: JSON.stringify(buildTime),
    },
    plugins: [react(), tailwindcss()],
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
