"use client"

export type ThemeName = "light" | "dark"
export type Theme = ThemeName | "system"

export function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark" || value === "system"
}

export function resolveThemeName(theme?: string | null): ThemeName | null {
  if (theme === "light" || theme === "dark") {
    return theme
  }

  return null
}

export function getSystemTheme(): ThemeName {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

export function getDomTheme(): ThemeName {
  return document.documentElement.classList.contains("light") ? "light" : "dark"
}

export function applyThemeToRoot(theme: ThemeName) {
  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(theme)
  root.style.colorScheme = theme
}
