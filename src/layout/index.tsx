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
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  AlertDialogActionButton,
  AlertDialogCancelButton,
} from "@/components/ui/dialog-action-button"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import {
  useAuthPermissions,
  useCurrentUser,
  useLogoutMutation,
} from "@/hooks/use-auth"
import {
  authQueryKeys,
  browserQueryKeys,
  monitorQueryKeys,
  systemQueryKeys,
} from "@/lib/query-keys"
import { useTranslation } from "@/components/providers/language-context"
import { localizedPath, localizedPublicPath } from "@/local"
import { AppSidebar } from "@/layout/components/app-sidebar"
import { PageTransition } from "@/layout/components/page-transition"
import { SiteHeader } from "@/layout/components/site-header"
import { TagsView } from "@/layout/components/tags-view"
import { visitedTagIdsAtom } from "@/layout/stores/tags-view"
import {
  getAuthorizedRouteIds,
  getAuthorizedRouteIconValues,
  getAuthorizedRouteTitleValues,
  getFirstAuthorizedPath,
  getRouteAccessTarget,
} from "@/router/access"
import {
  APP_ROUTE_BY_ID,
  APP_ROUTE_BY_PATH,
  DEFAULT_APP_ROUTE,
  type AppRouteId,
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
  const authorizedRouteIds = useMemo(
    () => getLayoutAuthorizedRouteIds(authPermissions.data),
    [authPermissions.data]
  )
  const firstAuthorizedRoute = useMemo(
    () => getLayoutFirstAuthorizedRoute(authPermissions.data),
    [authPermissions.data]
  )
  const visitedTags = useMemo(
    () =>
      visitedTagIds
        .filter((tagId) => authorizedRouteIds.has(tagId))
        .map((tagId) => APP_ROUTE_BY_ID[tagId]),
    [authorizedRouteIds, visitedTagIds]
  )
  const routeIconValues = useMemo(
    () => getAuthorizedRouteIconValues(authPermissions.data),
    [authPermissions.data]
  )
  const routeTitleValues = useMemo(
    () => getAuthorizedRouteTitleValues(authPermissions.data),
    [authPermissions.data]
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
      navigate(localizedPath(locale, route.path))
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
      const visibleNextTagIds = nextTagIds.filter((tagId) =>
        authorizedRouteIds.has(tagId)
      )
      const fallbackTagId =
        visibleNextTagIds[index - 1] ??
        visibleNextTagIds[index] ??
        firstAuthorizedRoute.id
      const fallback = APP_ROUTE_BY_ID[fallbackTagId]
      navigate(localizedPath(locale, fallback.path))
    }
  }

  function handleCloseCurrent() {
    handleCloseTag(routeMeta)
  }

  function handleCloseOthers() {
    const nextTagIds = [DEFAULT_APP_ROUTE, routeMeta.id].filter(
      (tagId, index, tagIds): tagId is AppRouteId =>
        authorizedRouteIds.has(tagId) && tagIds.indexOf(tagId) === index
    )

    setVisitedTagIds(
      nextTagIds.length > 0 ? nextTagIds : [firstAuthorizedRoute.id]
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
        (tagId, index) =>
          (tagId === DEFAULT_APP_ROUTE &&
            authorizedRouteIds.has(DEFAULT_APP_ROUTE)) ||
          index >= activeIndex
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
        (tagId, index) =>
          (tagId === DEFAULT_APP_ROUTE &&
            authorizedRouteIds.has(DEFAULT_APP_ROUTE)) ||
          index <= activeIndex
      )
    )
  }

  function handleCloseAll() {
    setVisitedTagIds([firstAuthorizedRoute.id])
    if (routeMeta.id !== firstAuthorizedRoute.id) {
      navigate(localizedPath(locale, firstAuthorizedRoute.path))
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
            <AlertDialogCancelButton disabled={logout.isPending}>
              {t("logout.cancel")}
            </AlertDialogCancelButton>
            <AlertDialogActionButton
              variant="destructive"
              disabled={logout.isPending}
              loading={logout.isPending}
              loadingText={t("logout.pending")}
              onClick={handleLogoutConfirm}
            >
              {t("logout.confirm")}
            </AlertDialogActionButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <SidebarInset className="h-svh min-h-0 overflow-hidden md:h-[calc(100svh-1rem)]">
        <SiteHeader>
          <TagsView
            activeRoute={routeMeta.id}
            isRefreshing={refreshing}
            routeIconValues={routeIconValues}
            routeTitleValues={routeTitleValues}
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

function getLayoutAuthorizedRouteIds(
  access: Parameters<typeof getAuthorizedRouteIds>[0]
) {
  const routeIds = new Set<AppRouteId>(getAuthorizedRouteIds(access))
  routeIds.add("account")
  return routeIds
}

function getLayoutFirstAuthorizedRoute(
  access: Parameters<typeof getFirstAuthorizedPath>[0]
) {
  const path = getFirstAuthorizedPath(access)
  return path ? (APP_ROUTE_BY_PATH[path] ?? HOME_ROUTE) : HOME_ROUTE
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
    case "dict":
      return [systemQueryKeys.dictTypes, systemQueryKeys.dictData]
    case "notices":
      return [systemQueryKeys.notices]
    case "browser-teams":
      return [browserQueryKeys.teams]
    case "browser-environments":
      return [browserQueryKeys.environments]
    case "browser-proxies":
      return [browserQueryKeys.proxies]
    case "browser-members":
      return [browserQueryKeys.members]
    case "browser-assets":
      return [browserQueryKeys.assets]
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
