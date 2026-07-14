import { type I18nKey } from "@/local"
import type { AppDownloadTarget } from "@/types/download"

export type TargetOption = AppDownloadTarget & {
  labelKey: I18nKey
  archLabelKey: I18nKey
}

export type PlatformOption = {
  platform: string
  labelKey: I18nKey
  iconSrc: string
}

type NavigatorUserAgentData = {
  platform?: string
  getHighEntropyValues?: (hints: string[]) => Promise<{
    architecture?: string
    bitness?: string
    platform?: string
  }>
}

export const TARGET_OPTIONS: TargetOption[] = [
  {
    platform: "macos",
    arch: "arm64",
    labelKey: "download.platform.macosArm",
    archLabelKey: "download.arch.appleSilicon",
  },
  {
    platform: "macos",
    arch: "x64",
    labelKey: "download.platform.macosIntel",
    archLabelKey: "download.arch.intel",
  },
  {
    platform: "windows",
    arch: "x64",
    labelKey: "download.platform.windowsX64",
    archLabelKey: "download.arch.x64",
  },
  {
    platform: "linux",
    arch: "x64",
    labelKey: "download.platform.linuxX64",
    archLabelKey: "download.arch.x64",
  },
]

export const PLATFORM_OPTIONS: PlatformOption[] = [
  {
    platform: "macos",
    labelKey: "download.platform.macos",
    iconSrc:
      "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/apple/apple-original.svg",
  },
  {
    platform: "windows",
    labelKey: "download.platform.windows",
    iconSrc:
      "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/windows8/windows8-original.svg",
  },
  {
    platform: "linux",
    labelKey: "download.platform.linux",
    iconSrc:
      "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/linux/linux-original.svg",
  },
]

export function getTargetLabel(
  target: AppDownloadTarget,
  t: (key: I18nKey) => string
) {
  const option = TARGET_OPTIONS.find((item) => sameTarget(item, target))

  return option ? t(option.labelKey) : `${target.platform} ${target.arch}`
}

export function getTargetsForPlatform(platform: string) {
  return TARGET_OPTIONS.filter((item) => item.platform === platform)
}

export function getDefaultTargetForPlatform(
  platform: string,
  preferredTarget: AppDownloadTarget
) {
  const platformTargets = getTargetsForPlatform(platform)

  return (
    platformTargets.find((item) => sameTarget(item, preferredTarget)) ??
    platformTargets.find((item) => item.arch === preferredTarget.arch) ??
    platformTargets[0] ??
    TARGET_OPTIONS[0]
  )
}

export function normalizeTarget(target: AppDownloadTarget) {
  return getDefaultTargetForPlatform(target.platform, target)
}

export function targetKey(target: AppDownloadTarget) {
  return `${target.platform}:${target.arch}`
}

export function sameTarget(left: AppDownloadTarget, right: AppDownloadTarget) {
  return left.platform === right.platform && left.arch === right.arch
}

export function detectBrowserTargetSync(): AppDownloadTarget {
  if (typeof navigator === "undefined") {
    return { platform: "macos", arch: "arm64" }
  }

  const userAgentData = getUserAgentData()
  const source = [
    userAgentData?.platform,
    navigator.platform,
    navigator.userAgent,
  ]
    .filter(Boolean)
    .join(" ")
  const platform = resolvePlatform(source, "macos")

  return {
    platform,
    arch: resolveArch(source, platform),
  }
}

export async function detectBrowserTarget(): Promise<AppDownloadTarget> {
  const fallback = detectBrowserTargetSync()
  const userAgentData = getUserAgentData()

  if (!userAgentData?.getHighEntropyValues) {
    return fallback
  }

  try {
    const values = await userAgentData.getHighEntropyValues([
      "architecture",
      "bitness",
      "platform",
    ])
    const source = [
      values.platform,
      userAgentData.platform,
      values.architecture,
      values.bitness,
    ]
      .filter(Boolean)
      .join(" ")
    const platform = resolvePlatform(source, fallback.platform)

    return {
      platform,
      arch: resolveArch(source, platform),
    }
  } catch {
    return fallback
  }
}

function getUserAgentData() {
  return (navigator as Navigator & { userAgentData?: NavigatorUserAgentData })
    .userAgentData
}

function resolvePlatform(source: string, fallback: string) {
  if (/win/i.test(source)) {
    return "windows"
  }

  if (/mac|iphone|ipad|ipod/i.test(source)) {
    return "macos"
  }

  if (/linux|x11/i.test(source)) {
    return "linux"
  }

  return fallback
}

function resolveArch(source: string, platform: string) {
  if (/arm|aarch64/i.test(source)) {
    return "arm64"
  }

  if (/x86_64|x64|win64|amd64|intel/i.test(source)) {
    return "x64"
  }

  return platform === "macos" ? "arm64" : "x64"
}
