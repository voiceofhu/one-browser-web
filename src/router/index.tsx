import { lazy, Suspense } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router"

import { Spinner } from "@/components/ui/spinner"
import { RouteProgressBar } from "@/layout/components/route-progress-bar"
import { RequireAuth } from "@/router/guards/require-auth"
import { LEGACY_ROUTE_REDIRECTS } from "@/router/routes"

const AppLayout = lazy(() => import("@/layout"))
const AccountProfilePage = lazy(() => import("@/views/account/profile"))
const IndexPage = lazy(() => import("@/views/index"))
const LoginPage = lazy(() => import("@/views/login"))
const HealthPage = lazy(() => import("@/views/monitor/health"))
const UserPage = lazy(() => import("@/views/system/user"))
const RolePage = lazy(() => import("@/views/system/role"))
const MenuPage = lazy(() => import("@/views/system/menu"))
const DeptPage = lazy(() => import("@/views/system/dept"))
const PostPage = lazy(() => import("@/views/system/post"))
const DictTypePage = lazy(() => import("@/views/system/dict/type"))
const OperationLogPage = lazy(() => import("@/views/system/log/operation"))
const LoginLogPage = lazy(() => import("@/views/system/log/login"))

export function AppRouter() {
  return (
    <BrowserRouter basename={import.meta.env.VITE_BASE_URL}>
      <RouteProgressBar />
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
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

function RouteLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background text-muted-foreground">
      <Spinner />
    </div>
  )
}
