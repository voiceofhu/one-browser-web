import { lazy, Suspense, useEffect, useMemo, type ReactNode } from "react"
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router"

import { useLanguage } from "@/components/providers/language-context"
import { useAuthPermissions } from "@/hooks/use-auth"
import { RouteProgressBar } from "@/layout/components/route-progress-bar"
import { RouteLoading } from "@/router/route-loading"
import {
  getAuthorizedDynamicRouteElements,
  getAuthorizedDynamicRouteRedirects,
  getLocalAuthenticatedRouteElements,
} from "@/router/dynamic-routes"
import { LoginSourceGate } from "@/router/guards/login-source-gate"
import { RequireAuth } from "@/router/guards/require-auth"
import { getFirstAuthorizedPath, getRouteAccessTarget } from "@/router/access"
import DownloadHomePage from "@/views/download"
import {
  localizedPath,
  getLocaleFromPathname,
  isSupportedLocale,
  localizedPublicPath,
  PUBLIC_LOCALE_ROUTES,
  stripLocaleFromPathname,
  type PublicLocaleRoute,
} from "@/local"
import {
  APP_ROUTE_BY_ID,
  APP_ROUTE_BY_PATH,
  DEFAULT_APP_ROUTE,
} from "@/router/routes"
import type { AuthPermissions } from "@/types/admin"

const AppLayout = lazy(() => import("@/layout"))
const LoginPage = lazy(() => import("@/views/login"))
const InvitePage = lazy(() => import("@/views/invite"))
const OAuthCallbackPage = lazy(() => import("@/views/login/oauth"))
const TermsPage = lazy(() => import("@/views/legal/terms"))
const PrivacyPage = lazy(() => import("@/views/legal/privacy"))

export function AppRouter() {
  return (
    <BrowserRouter basename={import.meta.env.VITE_BASE_URL}>
      <RouteLocaleSync />
      <RouteProgressBar />
      {/* <RouteLoading /> */}
      <Suspense fallback={<RouteLoading />}>
        <LoginSourceGate>
          <AppRouteTree />
        </LoginSourceGate>
      </Suspense>
    </BrowserRouter>
  )
}

function AppRouteTree() {
  const location = useLocation()
  const { locale } = useLanguage()
  const shouldLoadAuthorizedRoutes = !isPublicAppPath(location.pathname)
  const authPermissions = useAuthPermissions({
    enabled: shouldLoadAuthorizedRoutes,
  })
  const authorizedRouteElements = useMemo(
    () =>
      getAuthorizedDynamicRouteElements(
        shouldLoadAuthorizedRoutes ? authPermissions.data : undefined
      ),
    [authPermissions.data, shouldLoadAuthorizedRoutes]
  )
  const authorizedRouteRedirects = useMemo(
    () =>
      getAuthorizedDynamicRouteRedirects(
        shouldLoadAuthorizedRoutes ? authPermissions.data : undefined
      ),
    [authPermissions.data, shouldLoadAuthorizedRoutes]
  )
  const localRouteElements = useMemo(
    () => getLocalAuthenticatedRouteElements(),
    []
  )

  return (
    <Routes>
      <Route path="/" element={<LocaleHomeRedirect />} />
      <Route path="/login" element={<LocaleRedirect to="login" />} />
      <Route path="/invite" element={<LocaleRedirect to="invite" />} />
      <Route path="/terms" element={<LocaleRedirect to="terms" />} />
      <Route path="/privacy" element={<LocaleRedirect to="privacy" />} />
      <Route path="/oauth" element={<OAuthCallbackPage />} />
      <Route
        path="/:locale/oauth"
        element={
          <LocaleSegmentGuard>
            <OAuthCallbackPage />
          </LocaleSegmentGuard>
        }
      />
      <Route
        path="/:locale/login"
        element={
          <LocaleSegmentGuard>
            <LoginPage />
          </LocaleSegmentGuard>
        }
      />
      <Route
        path="/:locale/invite"
        element={
          <LocaleSegmentGuard>
            <InvitePage />
          </LocaleSegmentGuard>
        }
      />
      <Route
        path="/:locale/terms"
        element={
          <LocaleSegmentGuard>
            <TermsPage />
          </LocaleSegmentGuard>
        }
      />
      <Route
        path="/:locale/privacy"
        element={
          <LocaleSegmentGuard>
            <PrivacyPage />
          </LocaleSegmentGuard>
        }
      />
      <Route path="/:locale" element={<LocaleSegmentShell />}>
        <Route index element={<DownloadHomePage />} />
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          {localRouteElements.map((route) => (
            <Route key={route.id} path={route.path} element={route.element} />
          ))}
          {authorizedRouteElements.map((route) => (
            <Route key={route.id} path={route.path} element={route.element} />
          ))}
          {authorizedRouteRedirects.map((redirect) => (
            <Route
              key={redirect.key}
              path={redirect.path}
              element={
                <Navigate to={localizedPath(locale, redirect.to)} replace />
              }
            />
          ))}
          <Route
            path="*"
            element={<AuthorizedRouteFallback access={authPermissions.data} />}
          />
        </Route>
      </Route>
      <Route
        path="*"
        element={<LegacyLocalizedRedirect access={authPermissions.data} />}
      />
    </Routes>
  )
}

function LocaleHomeRedirect() {
  const location = useLocation()
  const { locale } = useLanguage()

  return (
    <Navigate
      to={`${localizedPath(locale, "/")}${location.search}${location.hash}`}
      replace
    />
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

function LocaleSegmentShell() {
  return (
    <LocaleSegmentGuard>
      <Outlet />
    </LocaleSegmentGuard>
  )
}

function LocaleSegmentGuard({ children }: { children: ReactNode }) {
  const params = useParams()
  const location = useLocation()
  const { locale } = useLanguage()
  const routeLocale = params.locale

  if (!routeLocale || !isSupportedLocale(routeLocale)) {
    const routePathname = pathnameWithoutFirstSegment(location.pathname)

    return (
      <Navigate
        to={`${localizedPath(locale, routePathname)}${location.search}${location.hash}`}
        replace
      />
    )
  }

  return children
}

function AuthorizedRouteFallback({
  access,
}: {
  access: AuthPermissions | undefined
}) {
  const location = useLocation()
  const { locale } = useLanguage()
  const accessTarget = getRouteFallbackTarget(location.pathname, access)

  return <Navigate to={localizedPath(locale, accessTarget)} replace />
}

function LegacyLocalizedRedirect({
  access,
}: {
  access: AuthPermissions | undefined
}) {
  const location = useLocation()
  const { locale } = useLanguage()
  const accessTarget = getRouteFallbackTarget(location.pathname, access)

  return (
    <Navigate
      to={`${localizedPath(locale, accessTarget)}${location.search}${location.hash}`}
      replace
    />
  )
}

function getRouteFallbackTarget(
  pathname: string,
  access: AuthPermissions | undefined
) {
  const routePath = getRouteAccessTarget(pathname)
  if (APP_ROUTE_BY_PATH[routePath]) {
    return routePath
  }

  return (
    getFirstAuthorizedPath(access) ?? APP_ROUTE_BY_ID[DEFAULT_APP_ROUTE].path
  )
}

function isPublicAppPath(pathname: string) {
  const routePathname = stripLocaleFromPathname(pathname)
  if (routePathname === "/") {
    return true
  }

  const route = routePathname.split("/").filter(Boolean)[0]

  return (
    route === "oauth" ||
    (route !== undefined &&
      PUBLIC_LOCALE_ROUTES.some((publicRoute) => publicRoute === route))
  )
}

function pathnameWithoutFirstSegment(pathname: string) {
  const segments = pathname.split("/").filter(Boolean).slice(1)

  return segments.length > 0 ? `/${segments.join("/")}` : "/"
}
