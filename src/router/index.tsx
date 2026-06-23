import { lazy, Suspense, useEffect } from "react"
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router"

import { useLanguage } from "@/components/providers/language-context"
import { Spinner } from "@/components/ui/spinner"
import { RouteProgressBar } from "@/layout/components/route-progress-bar"
import { RequireAuth } from "@/router/guards/require-auth"
import { LEGACY_ROUTE_REDIRECTS } from "@/router/routes"
import {
  getLocaleFromPathname,
  localizedPublicPath,
  type PublicLocaleRoute,
} from "@/lib/i18n"

const AppLayout = lazy(() => import("@/layout"))
const AccountProfilePage = lazy(() => import("@/views/account/profile"))
const IndexPage = lazy(() => import("@/views/index"))
const LoginPage = lazy(() => import("@/views/login"))
const TermsPage = lazy(() => import("@/views/legal/terms"))
const PrivacyPage = lazy(() => import("@/views/legal/privacy"))
const HealthPage = lazy(() => import("@/views/monitor/health"))
const JobsPage = lazy(() => import("@/views/monitor/job"))
const OnlineUsersPage = lazy(() => import("@/views/monitor/online"))
const UserPage = lazy(() => import("@/views/system/user"))
const RolePage = lazy(() => import("@/views/system/role"))
const MenuPage = lazy(() => import("@/views/system/menu"))
const DeptPage = lazy(() => import("@/views/system/dept"))
const PostPage = lazy(() => import("@/views/system/post"))
const DictTypePage = lazy(() => import("@/views/system/dict/type"))
const NoticePage = lazy(() => import("@/views/system/notice"))
const OperationLogPage = lazy(() => import("@/views/system/log/operation"))
const LoginLogPage = lazy(() => import("@/views/system/log/login"))

export function AppRouter() {
  return (
    <BrowserRouter basename={import.meta.env.VITE_BASE_URL}>
      <RouteLocaleSync />
      <RouteProgressBar />
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/login" element={<LocaleRedirect to="login" />} />
          <Route path="/terms" element={<LocaleRedirect to="terms" />} />
          <Route path="/privacy" element={<LocaleRedirect to="privacy" />} />
          <Route path="/:locale/login" element={<LoginPage />} />
          <Route path="/:locale/terms" element={<TermsPage />} />
          <Route path="/:locale/privacy" element={<PrivacyPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/index" replace />} />
            <Route path="index" element={<IndexPage />} />
            <Route path="account/profile" element={<AccountProfilePage />} />
            <Route path="system/user" element={<UserPage />} />
            <Route path="system/role" element={<RolePage />} />
            <Route path="system/menu" element={<MenuPage />} />
            <Route path="system/dept" element={<DeptPage />} />
            <Route path="system/post" element={<PostPage />} />
            <Route path="system/dict" element={<DictTypePage />} />
            <Route path="system/notice" element={<NoticePage />} />
            <Route
              path="system/dict/type"
              element={<Navigate to="/system/dict" replace />}
            />
            <Route
              path="system/dict/data"
              element={<Navigate to="/system/dict" replace />}
            />
            <Route path="system/log/operation" element={<OperationLogPage />} />
            <Route path="system/log/login" element={<LoginLogPage />} />
            <Route path="monitor/health" element={<HealthPage />} />
            <Route path="monitor/online" element={<OnlineUsersPage />} />
            <Route path="monitor/job" element={<JobsPage />} />
          </Route>
          {Object.entries(LEGACY_ROUTE_REDIRECTS).map(([path, target]) => (
            <Route
              key={path}
              path={path}
              element={<Navigate to={target} replace />}
            />
          ))}
          <Route path="*" element={<Navigate to="/index" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

function RouteLocaleSync() {
  const location = useLocation()
  const { locale, setLocale } = useLanguage()

  useEffect(() => {
    const routeLocale = getLocaleFromPathname(location.pathname)
    if (routeLocale && routeLocale !== locale) {
      setLocale(routeLocale)
    }
  }, [locale, location.pathname, setLocale])

  return null
}

function LocaleRedirect({ to }: { to: PublicLocaleRoute }) {
  const location = useLocation()
  const { locale } = useLanguage()

  return (
    <Navigate
      to={`${localizedPublicPath(locale, to)}${location.search}${location.hash}`}
      replace
    />
  )
}

function RouteLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background text-muted-foreground">
      <Spinner />
    </div>
  )
}
