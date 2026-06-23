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
import { useTranslation } from "@/components/providers/language-context"
import { localizedPublicPath } from "@/local"
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
  const { locale, t } = useTranslation()
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
      toast.success(t("layout.refreshSuccess"))
    } catch (error) {
      toast.error(getErrorMessage(error, t("layout.actionFailed")))
    } finally {
      window.setTimeout(() => setRefreshing(false), 560)
    }
  }

  function handleLogoutConfirm(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()

    logout.mutate(undefined, {
      onSuccess: () => {
        setLogoutConfirmOpen(false)
        toast.success(t("logout.success"))
        navigate(localizedPublicPath(locale, "login"), { replace: true })
      },
      onError: (error) =>
        toast.error(getErrorMessage(error, t("layout.actionFailed"))),
    })
  }

  return (
    <SidebarProvider
      className="h-svh overflow-hidden"
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
            <AlertDialogTitle>{t("logout.confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("logout.confirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={logout.isPending}>
              {t("logout.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={logout.isPending}
              onClick={handleLogoutConfirm}
            >
              {logout.isPending ? t("logout.pending") : t("logout.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <SidebarInset className="h-svh min-h-0 overflow-hidden md:h-[calc(100svh-1rem)]">
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
        <main className="@container/main flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
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

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
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
    case "notices":
      return [systemQueryKeys.notices]
    case "operation-logs":
      return [systemQueryKeys.operationLogs]
    case "login-logs":
      return [systemQueryKeys.loginLogs]
    case "health":
      return [monitorQueryKeys.health]
    case "online-users":
      return [monitorQueryKeys.onlineUsers]
    case "jobs":
      return [monitorQueryKeys.jobs]
    case "account":
      return [authQueryKeys.currentUser]
  }
}
