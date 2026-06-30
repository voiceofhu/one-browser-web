import * as React from "react"
import { Navigate, useLocation } from "react-router"
import { toast } from "sonner"

import { useLanguage } from "@/components/providers/language-context"
import { useAppAuthorizeMutation, useCurrentUser } from "@/hooks/use-auth"
import {
  isLoginPath,
  localizedPublicPath,
  stripLocaleFromPathname,
} from "@/local"
import { APP_LOGIN_SOURCE, resolveLoginSource } from "@/lib/login-source"
import { isUnauthorizedError } from "@/lib/request"
import { RouteLoading } from "@/router/route-loading"
import { AppAuthorizationSuccess } from "@/views/login/app-authorization-success"

type ActiveLoginSource = Exclude<
  ReturnType<typeof resolveLoginSource>,
  { kind: "web" }
>

export function LoginSourceGate({ children }: React.PropsWithChildren) {
  const location = useLocation()
  const loginSource = React.useMemo(() => {
    const params = new URLSearchParams(location.search)

    return resolveLoginSource(params.get("from"))
  }, [location.search])

  if (
    loginSource.kind === "web" ||
    isLoginPath(location.pathname) ||
    isOAuthPath(location.pathname)
  ) {
    return children
  }

  return (
    <ActiveLoginSourceGate
      key={`${location.pathname}${location.search}${location.hash}`}
      loginSource={loginSource}
    >
      {children}
    </ActiveLoginSourceGate>
  )
}

function ActiveLoginSourceGate({
  children,
  loginSource,
}: {
  children: React.ReactNode
  loginSource: ActiveLoginSource
}) {
  const location = useLocation()
  const { locale, t } = useLanguage()
  const currentUser = useCurrentUser()
  const appAuthorizeMutation = useAppAuthorizeMutation()
  const [appAuthorizationUrl, setAppAuthorizationUrl] = React.useState<
    string | null
  >(null)
  const appAuthorizationRequested = React.useRef(false)

  React.useEffect(() => {
    if (
      loginSource.kind !== "app" ||
      !currentUser.isSuccess ||
      appAuthorizationUrl ||
      appAuthorizationRequested.current ||
      appAuthorizeMutation.isPending
    ) {
      return
    }

    appAuthorizationRequested.current = true
    appAuthorizeMutation.mutate(undefined, {
      onSuccess: setAppAuthorizationUrl,
    })
  }, [
    appAuthorizationUrl,
    appAuthorizeMutation,
    currentUser.isSuccess,
    loginSource.kind,
  ])

  React.useEffect(() => {
    if (loginSource.kind !== "external" || !currentUser.isSuccess) {
      return
    }

    window.location.assign(loginSource.url)
  }, [currentUser.isSuccess, loginSource])

  React.useEffect(() => {
    if (loginSource.kind !== "app" || !appAuthorizeMutation.isError) {
      return
    }

    toast.error(
      getErrorMessage(appAuthorizeMutation.error, t("layout.actionFailed"))
    )
  }, [
    appAuthorizeMutation.error,
    appAuthorizeMutation.isError,
    loginSource.kind,
    t,
  ])

  if (appAuthorizationUrl) {
    return <AppAuthorizationSuccess appUrl={appAuthorizationUrl} />
  }

  if (currentUser.isLoading) {
    return <RouteLoading />
  }

  if (isUnauthorizedError(currentUser.error)) {
    return (
      <Navigate
        to={buildLoginSourcePath(locale, loginSource)}
        state={{ from: location }}
        replace
      />
    )
  }

  if (currentUser.isError) {
    return children
  }

  if (appAuthorizeMutation.isError) {
    return children
  }

  return <RouteLoading />
}

function buildLoginSourcePath(locale: string, loginSource: ActiveLoginSource) {
  const params = new URLSearchParams({
    from: loginSource.kind === "app" ? APP_LOGIN_SOURCE : loginSource.url,
  })

  return `${localizedPublicPath(locale, "login")}?${params.toString()}`
}

function isOAuthPath(pathname: string) {
  const route = stripLocaleFromPathname(pathname).split("/").filter(Boolean)[0]

  return route === "oauth"
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}
