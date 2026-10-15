import { LoadingState } from '@/components/loading-state';
import {
  RouteProgress,
  RouteProgressPending,
} from '@/components/route-progress';
import { SweepShine } from '@/components/ui/sweep-shine';
import { AccountSettingsLayout } from '@/features/account/profile/account-settings-layout';
import { AuthGate } from '@/features/auth/auth-gate';
import { DashboardShell } from '@/features/browser-shell/dashboard-shell';
import { AppErrorBoundary } from '@/views/error/error-boundary';
import ErrorPage from '@/views/error/error-page';
import NotFound from '@/views/error/not-found';
import { lazy, Suspense, useDeferredValue } from 'react';
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useOutlet,
} from 'react-router-dom';

const LoginPage = lazy(() => import('@/views/auth/login'));
const DownloadPage = lazy(() => import('@/views/download'));
const CallbackPage = lazy(() => import('@/views/auth/callback'));
const TeamInvitePage = lazy(() => import('@/views/auth/team-invite'));
const DashboardOverviewPage = lazy(() => import('@/views/dashboard'));
const EnvironmentsPage = lazy(() => import('@/views/browser/environments'));
const ProxiesPage = lazy(() => import('@/views/browser/proxies'));
const TeamsPage = lazy(() => import('@/views/browser/teams'));
const TeamRolesPage = lazy(() => import('@/views/browser/roles'));
const MembersPage = lazy(() => import('@/views/browser/members'));
const VersionsPage = lazy(() => import('@/views/browser/versions'));
const SettingsPage = lazy(() => import('@/views/browser/settings'));
const AccountProfilePage = lazy(() => import('@/views/account/profile'));
const AccountPasswordPage = lazy(
  () => import('@/views/account/password/redirect'),
);
const AccountInvitePage = lazy(() => import('@/views/account/invite'));
const SystemUserPage = lazy(() => import('@/views/system/user'));
const SystemRolePage = lazy(() => import('@/views/system/role'));
const SystemMenuPage = lazy(() => import('@/views/system/menu'));
const SystemNoticePage = lazy(() => import('@/views/system/notice'));
const EgressNodePage = lazy(() => import('@/views/system/egress/node'));
const OperationLogPage = lazy(() => import('@/views/system/log/operation'));
const LoginLogPage = lazy(() => import('@/views/system/log/login'));
const HealthPage = lazy(() => import('@/views/monitor/health'));
const JobPage = lazy(() => import('@/views/monitor/job'));
const errorStatuses = [401, 403, 404, 408, 429, 500, 502, 503, 504];

export function AppRouter() {
  const location = useLocation();

  return (
    <AppErrorBoundary resetKey={location.key}>
      <RouteProgress />
      <Suspense
        fallback={
          <>
            <RouteProgressPending />
            <LoadingState
              className="bg-background min-h-dvh"
              label="正在加载工作区..."
            />
          </>
        }
      >
        <Routes>
          {errorStatuses.map((status) => (
            <Route
              key={status}
              path={`/${status}`}
              element={<ErrorPage error={{ status }} />}
            />
          ))}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/download" element={<DownloadPage />} />
          <Route path="/callback" element={<CallbackPage />} />
          <Route path="/team-invite" element={<TeamInvitePage />} />
          <Route path="/index" element={<Navigate to="/dashboard" replace />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardOverviewPage />} />
            <Route path="/system/user" element={<SystemUserPage />} />
            <Route path="/system/role" element={<SystemRolePage />} />
            <Route path="/browser/roles" element={<TeamRolesPage />} />
            <Route path="/system/menu" element={<SystemMenuPage />} />
            <Route path="/system/notice" element={<SystemNoticePage />} />
            <Route path="/system/egress/node" element={<EgressNodePage />} />
            <Route
              path="/system/log/operation"
              element={<OperationLogPage />}
            />
            <Route path="/system/log/login" element={<LoginLogPage />} />
            <Route path="/monitor/health" element={<HealthPage />} />
            <Route path="/monitor/job" element={<JobPage />} />
            <Route path="/environments" element={<EnvironmentsPage />} />
            <Route path="/proxies" element={<ProxiesPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route
              path="/roles"
              element={<Navigate to="/system/role" replace />}
            />
            <Route
              path="/permissions"
              element={<Navigate to="/system/menu" replace />}
            />
            <Route path="/versions" element={<VersionsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/account/password" element={<AccountPasswordPage />} />
            <Route path="/account" element={<AccountLayout />}>
              <Route index element={<Navigate to="profile" replace />} />
              <Route path="profile" element={<AccountProfilePage />} />
              <Route path="invite" element={<AccountInvitePage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AppErrorBoundary>
  );
}

function DashboardLayout() {
  const location = useLocation();
  const outlet = useOutlet();
  const deferredLocationKey = useDeferredValue(location.key);
  const deferredOutlet = useDeferredValue(outlet);

  return (
    <AuthGate>
      <DashboardShell>
        {location.key !== deferredLocationKey && <RouteProgressPending />}
        <AppErrorBoundary resetKey={location.key} embedded>
          <Suspense fallback={<RouteLoading />}>{deferredOutlet}</Suspense>
        </AppErrorBoundary>
      </DashboardShell>
    </AuthGate>
  );
}

function RouteLoading() {
  return (
    <div
      role="status"
      aria-label="页面加载中"
      className="bg-card text-muted-foreground flex min-h-0 flex-1 items-center justify-center text-sm"
    >
      <RouteProgressPending />
      <SweepShine>页面加载中</SweepShine>
    </div>
  );
}

function AccountLayout() {
  return (
    <AccountSettingsLayout>
      <Outlet />
    </AccountSettingsLayout>
  );
}
