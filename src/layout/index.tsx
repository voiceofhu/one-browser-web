import { toast } from "sonner"
import { Outlet, useLocation, useNavigate } from "react-router"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useCurrentUser, useLogoutMutation } from "@/hooks/use-auth"
import { AppSidebar } from "@/layout/components/app-sidebar"
import { SiteHeader } from "@/layout/components/site-header"
import {
  APP_ROUTE_BY_ID,
  APP_ROUTE_BY_PATH,
  DEFAULT_APP_ROUTE,
} from "@/router/routes"

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const currentUser = useCurrentUser()
  const logout = useLogoutMutation()
  const routeMeta =
    APP_ROUTE_BY_PATH[location.pathname] ?? APP_ROUTE_BY_ID[DEFAULT_APP_ROUTE]

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 64)",
          "--header-height": "calc(var(--spacing) * 14)",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        variant="inset"
        activeRoute={routeMeta.id}
        currentUser={currentUser.data}
        onLogout={() =>
          logout.mutate(undefined, {
            onSuccess: () => {
              toast.success("已退出登录")
              navigate("/login", { replace: true })
            },
            onError: (error) => toast.error(getErrorMessage(error)),
          })
        }
      />
      <SidebarInset>
        <SiteHeader title={routeMeta.title} />
        <main className="@container/main flex flex-1 flex-col bg-background">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "操作失败，请稍后重试。"
}
