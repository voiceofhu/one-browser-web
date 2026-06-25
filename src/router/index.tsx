import { lazy, Suspense, useEffect, useMemo } from "react"
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router"

import { useLanguage } from "@/components/providers/language-context"
import { useAuthPermissions } from "@/hooks/use-auth"
import { RouteProgressBar } from "@/layout/components/route-progress-bar"
import {
  getAuthorizedDynamicRouteElements,
  getAuthorizedDynamicRouteRedirects,
  getLocalAuthenticatedRouteElements,
} from "@/router/dynamic-routes"
import { RequireAuth } from "@/router/guards/require-auth"
import { LEGACY_ROUTE_REDIRECTS } from "@/router/routes"
import { getFirstAuthorizedPath } from "@/router/access"
import {
  getLocaleFromPathname,
  isSupportedLocale,
  localizedPublicPath,
  PUBLIC_LOCALE_ROUTES,
  type PublicLocaleRoute,
} from "@/local"
import type { AuthPermissions } from "@/types/admin"
import { APP_NAME } from "@/app"

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
        <AppRouteTree />
      </Suspense>
    </BrowserRouter>
  )
}

function AppRouteTree() {
  const location = useLocation()
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
      <Route path="/login" element={<LocaleRedirect to="login" />} />
      <Route path="/invite" element={<LocaleRedirect to="invite" />} />
      <Route path="/terms" element={<LocaleRedirect to="terms" />} />
      <Route path="/privacy" element={<LocaleRedirect to="privacy" />} />
      <Route path="/oauth" element={<OAuthCallbackPage />} />
      <Route path="/:locale/oauth" element={<OAuthCallbackPage />} />
      <Route path="/:locale/login" element={<LoginPage />} />
      <Route path="/:locale/invite" element={<InvitePage />} />
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
        <Route
          index
          element={<AuthorizedIndexRedirect access={authPermissions.data} />}
        />
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
            element={<Navigate to={redirect.to} replace />}
          />
        ))}
        <Route
          path="*"
          element={<AuthorizedRouteFallback access={authPermissions.data} />}
        />
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

function AuthorizedIndexRedirect({
  access,
}: {
  access: AuthPermissions | undefined
}) {
  return <Navigate to={getFirstAuthorizedPath(access) ?? "/index"} replace />
}

function AuthorizedRouteFallback({
  access,
}: {
  access: AuthPermissions | undefined
}) {
  return <Navigate to={getFirstAuthorizedPath(access) ?? "/index"} replace />
}

function isPublicAppPath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  const firstSegment = segments[0]
  const hasLocalePrefix = Boolean(
    firstSegment && isSupportedLocale(firstSegment)
  )
  const route = segments[hasLocalePrefix ? 1 : 0]

  return (
    route === "oauth" ||
    (route !== undefined &&
      PUBLIC_LOCALE_ROUTES.some((publicRoute) => publicRoute === route))
  )
}

function RouteLoading() {
  return (
    <div className="fixed inset-0 z-50 flex min-h-svh items-center justify-center bg-black text-white">
      <div className="text-center text-[12vmin] font-semibold tracking-normal select-none sm:text-[15vmin] md:text-[15vmin] lg:text-[17vim]">
        {APP_NAME}
      </div>
    </div>
  )
}
