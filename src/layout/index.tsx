import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react"
import { useAtom } from "jotai"
import { useQueryClient } from "@tanstack/react-query"
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
import {
  useAuthPermissions,
  useCurrentUser,
  useLogoutMutation,
} from "@/hooks/use-auth"
import {
  authQueryKeys,
  monitorQueryKeys,
  systemQueryKeys,
} from "@/lib/query-keys"
import { AppSidebar } from "@/layout/components/app-sidebar"
import { PageTransition } from "@/layout/components/page-transition"
import { SiteHeader } from "@/layout/components/site-header"
import { TagsView } from "@/layout/components/tags-view"
import { visitedTagIdsAtom } from "@/layout/stores/tags-view"
import { getRouteAccessTarget } from "@/router/access"
import {
  APP_ROUTE_BY_ID,
  APP_ROUTE_BY_PATH,
  DEFAULT_APP_ROUTE,
  type AppRouteMeta,
} from "@/router/routes"

const HOME_ROUTE = APP_ROUTE_BY_ID[DEFAULT_APP_ROUTE]

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUser = useCurrentUser()
  const authPermissions = useAuthPermissions()
  const logout = useLogoutMutation()
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [visitedTagIds, setVisitedTagIds] = useAtom(visitedTagIdsAtom)
  const [outletRefreshKey, setOutletRefreshKey] = useState(0)
  const routePath = getRouteAccessTarget(location.pathname)
  const routeMeta =
    APP_ROUTE_BY_PATH[routePath] ?? APP_ROUTE_BY_ID[DEFAULT_APP_ROUTE]
  const routeTransitionKey = `${location.pathname}${location.search}`
  const pageTransitionKey = `${routeTransitionKey}:${outletRefreshKey}`
  const visitedTags = useMemo(
    () => visitedTagIds.map((tagId) => APP_ROUTE_BY_ID[tagId]),
    [visitedTagIds]
  )

  useEffect(() => {
    setVisitedTagIds((tagIds) => {
      if (tagIds.includes(routeMeta.id)) {
        return tagIds
      }

      return [...tagIds, routeMeta.id]
    })
  }, [routeMeta.id, setVisitedTagIds])

  function handleSelectTag(route: AppRouteMeta) {
    if (route.path !== routeMeta.path) {
      navigate(route.path)
    }
  }

  function handleCloseTag(route: AppRouteMeta) {
    if (route.id === DEFAULT_APP_ROUTE) {
      return
    }

    const index = visitedTagIds.findIndex((tagId) => tagId === route.id)
    const nextTagIds = visitedTagIds.filter((tagId) => tagId !== route.id)
    setVisitedTagIds(nextTagIds)

    if (route.id === routeMeta.id) {
      const fallbackTagId =
        nextTagIds[index - 1] ?? nextTagIds[index] ?? DEFAULT_APP_ROUTE
      const fallback = APP_ROUTE_BY_ID[fallbackTagId]
      navigate(fallback.path)
    }
  }

  function handleCloseCurrent() {
    handleCloseTag(routeMeta)
  }

  function handleCloseOthers() {
    setVisitedTagIds(
      routeMeta.id === DEFAULT_APP_ROUTE
        ? [DEFAULT_APP_ROUTE]
        : [DEFAULT_APP_ROUTE, routeMeta.id]
    )
  }

  function handleCloseLeft() {
    const activeIndex = visitedTagIds.findIndex(
      (tagId) => tagId === routeMeta.id
    )
    if (activeIndex < 0) {
      return
    }

    setVisitedTagIds((tagIds) =>
      tagIds.filter(
        (tagId, index) => tagId === DEFAULT_APP_ROUTE || index >= activeIndex
      )
    )
  }

  function handleCloseRight() {
    const activeIndex = visitedTagIds.findIndex(
      (tagId) => tagId === routeMeta.id
    )
    if (activeIndex < 0) {
      return
    }

    setVisitedTagIds((tagIds) =>
      tagIds.filter(
        (tagId, index) => tagId === DEFAULT_APP_ROUTE || index <= activeIndex
      )
    )
  }

  function handleCloseAll() {
    setVisitedTagIds([DEFAULT_APP_ROUTE])
    if (routeMeta.id !== DEFAULT_APP_ROUTE) {
      navigate(HOME_ROUTE.path)
    }
  }

  async function handleRefreshCurrent() {
    setRefreshing(true)

    try {
      await Promise.all(
        getRefreshQueryKeys(routeMeta.id).map((queryKey) =>
          queryClient.invalidateQueries({ queryKey })
        )
      )
      setOutletRefreshKey((key) => key + 1)
      toast.success("刷新完成")
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      window.setTimeout(() => setRefreshing(false), 560)
    }
  }

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
          "--header-height": "34px",
        } as CSSProperties
      }
    >
      <AppSidebar
        variant="inset"
        activeRoute={routeMeta.id}
        currentUser={currentUser.data}
        authPermissions={authPermissions.data}
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
        <SiteHeader>
          <TagsView
            activeRoute={routeMeta.id}
            isRefreshing={refreshing}
            tags={visitedTags}
            onCloseAll={handleCloseAll}
            onCloseCurrent={handleCloseCurrent}
            onCloseLeft={handleCloseLeft}
            onCloseOthers={handleCloseOthers}
            onCloseRight={handleCloseRight}
            onCloseTag={handleCloseTag}
            onRefresh={handleRefreshCurrent}
            onSelectTag={handleSelectTag}
          />
        </SiteHeader>
        <main className="@container/main flex flex-1 flex-col bg-background">
          <PageTransition
            routeKey={routeTransitionKey}
            transitionKey={pageTransitionKey}
          >
            <Outlet key={outletRefreshKey} />
          </PageTransition>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "操作失败，请稍后重试。"
}

function getRefreshQueryKeys(routeId: AppRouteMeta["id"]) {
  switch (routeId) {
    case "overview":
      return [
        authQueryKeys.currentUser,
        monitorQueryKeys.health,
        systemQueryKeys.all,
      ]
    case "users":
      return [systemQueryKeys.users]
    case "roles":
      return [systemQueryKeys.roles]
    case "menus":
      return [systemQueryKeys.menus]
    case "depts":
      return [systemQueryKeys.depts]
    case "posts":
      return [systemQueryKeys.posts]
    case "dict":
      return [systemQueryKeys.dictTypes, systemQueryKeys.dictData]
    case "operation-logs":
      return [systemQueryKeys.operationLogs]
    case "login-logs":
      return [systemQueryKeys.loginLogs]
    case "health":
      return [monitorQueryKeys.health]
    case "account":
      return [authQueryKeys.currentUser]
  }
}
