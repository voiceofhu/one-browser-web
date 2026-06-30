export const APP_LOGIN_SOURCE = "one-browser-app"

export type LoginSource =
  | { kind: "web" }
  | { kind: "app"; value: typeof APP_LOGIN_SOURCE }
  | { kind: "external"; url: string; origin: string }

export function resolveLoginSource(value: string | null): LoginSource {
  const source = value?.trim()
  if (!source) {
    return { kind: "web" }
  }

  if (source === APP_LOGIN_SOURCE) {
    return { kind: "app", value: APP_LOGIN_SOURCE }
  }

  const externalUrl = parseExternalLoginSource(source)
  if (externalUrl) {
    return {
      kind: "external",
      url: externalUrl.toString(),
      origin: externalUrl.origin,
    }
  }

  return { kind: "web" }
}

export function getLoginReturnTarget(source: LoginSource, webRedirect: string) {
  if (source.kind === "external") {
    return source.url
  }

  return webRedirect
}

export function shouldUseDocumentRedirect(value: string) {
  if (value.startsWith("/api/")) {
    return true
  }

  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function parseExternalLoginSource(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:" ? url : null
  } catch {
    return null
  }
}
