import { AppInfo, formatBuildTime } from '@/components/ui/app-info';

import pkg from '../../../package.json';

const info = {
  [pkg.name]: pkg.version,
  'build time': formatBuildTime(
    __APP_BUILD_TIME__,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ),
  'public env': {
    MODE: import.meta.env.MODE,
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_BASE_URL: import.meta.env.VITE_BASE_URL,
    VITE_DESKTOP_API_MOCK: import.meta.env.VITE_DESKTOP_API_MOCK,
    VITE_TURNSTILE_SITE_KEY: import.meta.env.VITE_TURNSTILE_SITE_KEY,
    VITE_WEB_LOGIN_URL: import.meta.env.VITE_WEB_LOGIN_URL,
  },
};

// Logs build metadata to the console once; renders nothing.
export default function BuildInfo() {
  return <AppInfo info={info} />;
}
