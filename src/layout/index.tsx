import { useState, type CSSProperties, type MouseEvent } from "react"
import { toast } from "sonner"
import { Outlet, useLocation, useNavigate } from "react-router"
import { LogOutIcon } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const routeMeta =
    APP_ROUTE_BY_PATH[location.pathname] ?? APP_ROUTE_BY_ID[DEFAULT_APP_ROUTE]

  function handleLogoutConfirm(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()

    logout.mutate(undefined, {
      onSuccess: () => {
        setLogoutConfirmOpen(false)
        toast.success("已退出登录")
        navigate("/login", { replace: true })
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    })
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 64)",
          "--header-height": "calc(var(--spacing) * 14)",
        } as CSSProperties
      }
    >
      <AppSidebar
        variant="inset"
        activeRoute={routeMeta.id}
        currentUser={currentUser.data}
        onLogout={() => setLogoutConfirmOpen(true)}
      />
      <AlertDialog
        open={logoutConfirmOpen}
        onOpenChange={(open) => {
          if (!logout.isPending) {
            setLogoutConfirmOpen(open)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <LogOutIcon />
            </AlertDialogMedia>
            <AlertDialogTitle>确认退出登录？</AlertDialogTitle>
            <AlertDialogDescription>
              退出后需要重新登录才能继续使用后台管理功能。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={logout.isPending}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={logout.isPending}
              onClick={handleLogoutConfirm}
            >
              {logout.isPending ? "退出中..." : "确认退出"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <SidebarInset className="overflow-hidden">
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
