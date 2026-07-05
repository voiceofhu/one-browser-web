/// <reference types="vite/client" />

declare const __APP_BUILD_TIME__: string

interface ImportMetaEnv {
  readonly VITE_APP_ENV: "development" | "stage" | "production"
  readonly VITE_API_URL: string
  readonly VITE_BASE_URL: string
  readonly VITE_APP_PUBLIC_URL?: string
  readonly VITE_GOOGLE_OAUTH_ID?: string
  readonly VITE_TURNSTILE_SITE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
