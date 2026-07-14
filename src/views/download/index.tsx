import { useEffect, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertCircleIcon, DownloadIcon, RefreshCwIcon } from "lucide-react"

import { getLatestAppDownload } from "@/api/download"
import { useTranslation } from "@/components/providers/language-context"
import { ThemeToggleButton } from "@/components/theme/theme-toggle-button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AnimatedSegmentedTabs } from "@/components/ui/animated-segmented-tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { LanguageSwitcher } from "@/layout/components/language-switcher"
import { type I18nKey, type Locale } from "@/local"
import { appDownloadQueryKeys } from "@/lib/query-keys"
import { HttpError } from "@/lib/request"
import type { AppDownloadResource } from "@/types/download"
import {
  PLATFORM_OPTIONS,
  detectBrowserTarget,
  detectBrowserTargetSync,
  getDefaultTargetForPlatform,
  getTargetLabel,
  getTargetsForPlatform,
  normalizeTarget,
  sameTarget,
  targetKey,
} from "./download-targets"

const DOWNLOAD_APP_NAME = "One Browser"
const APP_ICON_SRC = `${import.meta.env.BASE_URL.replace(/\/?$/, "/")}pwa-512x512.png`

export default function DownloadHomePage() {
  const { locale, t } = useTranslation()
  const [recommendedTarget, setRecommendedTarget] = useState(() =>
    normalizeTarget(detectBrowserTargetSync())
  )
  const [selectedTarget, setSelectedTarget] = useState(recommendedTarget)
  const [isTargetResolved, setIsTargetResolved] = useState(false)
  const initialTargetRef = useRef(recommendedTarget)
  const platformTargets = getTargetsForPlatform(selectedTarget.platform)
  const downloadQuery = useQuery({
    queryKey: appDownloadQueryKeys.latest(
      selectedTarget.platform,
      selectedTarget.arch
    ),
    queryFn: () => getLatestAppDownload(selectedTarget),
    enabled: isTargetResolved,
    retry: false,
  })
  const download = downloadQuery.data
  const selectedLabel = getTargetLabel(selectedTarget, t)
  const downloadError = downloadQuery.error
    ? getDownloadErrorMessage(downloadQuery.error, t)
    : null
  const isRecommended = sameTarget(selectedTarget, recommendedTarget)
  const isDownloadLoading =
    !isTargetResolved ||
    downloadQuery.isLoading ||
    (downloadQuery.isFetching && !download)
  const packageName = download?.file_name ?? t("download.noPackage")
  const packageMeta = download
    ? getDownloadMetaLine(download, locale, t)
    : t("download.noPackageForTarget")

  useEffect(() => {
    let mounted = true

    void detectBrowserTarget().then((detectedTarget) => {
      if (!mounted) {
        return
      }

      const target = normalizeTarget(detectedTarget)
      setRecommendedTarget(target)
      setSelectedTarget((current) =>
        sameTarget(current, initialTargetRef.current) ? target : current
      )
      setIsTargetResolved(true)
    })

    return () => {
      mounted = false
    }
  }, [])

  return (
    <main className="min-h-svh bg-background text-foreground">
      <header className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <img src={APP_ICON_SRC} alt="" className="size-8 rounded-md" />
          <span className="truncate text-sm font-semibold">
            {DOWNLOAD_APP_NAME}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <LanguageSwitcher />
          <ThemeToggleButton />
        </div>
      </header>

      <section className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-5">
          <div className="min-w-0">
            <h1 className="sr-only">{DOWNLOAD_APP_NAME}</h1>
            <p className="text-sm text-muted-foreground">
              {t("download.subtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <AnimatedSegmentedTabs
              label={t("download.selectPlatform")}
              value={selectedTarget.platform}
              className="max-w-full"
              listClassName="max-w-full overflow-x-auto"
              triggerClassName="px-3"
              options={PLATFORM_OPTIONS.map(
                ({ platform, labelKey, iconSrc }) => ({
                  value: platform,
                  label: (
                    <>
                      <img
                        src={iconSrc}
                        alt=""
                        aria-hidden="true"
                        className="size-4 shrink-0 opacity-70"
                      />
                      <span>{t(labelKey)}</span>
                    </>
                  ),
                })
              )}
              onValueChange={(platform) => {
                setSelectedTarget(
                  getDefaultTargetForPlatform(platform, recommendedTarget)
                )
              }}
            />

            <AnimatedSegmentedTabs
              label={t("download.selectArchitecture")}
              value={targetKey(selectedTarget)}
              className="ml-auto max-w-full"
              listClassName="max-w-full overflow-x-auto"
              triggerClassName="px-3"
              options={platformTargets.map((option) => ({
                value: targetKey(option),
                label: <span>{t(option.archLabelKey)}</span>,
              }))}
              onValueChange={(value) => {
                const option = platformTargets.find(
                  (item) => targetKey(item) === value
                )
                if (option) {
                  setSelectedTarget(option)
                }
              }}
            />
          </div>

          <section aria-busy={isDownloadLoading}>
            {isDownloadLoading ? (
              <DownloadResultSkeleton />
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <h2 className="truncate text-base font-semibold">
                      {selectedLabel}
                    </h2>
                    {isRecommended ? (
                      <Badge variant="secondary">
                        {t("download.recommended")}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {packageName}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {packageMeta}
                  </p>
                </div>

                <DownloadButton
                  download={download}
                  label={t("download.download")}
                  unavailableLabel={t("download.unavailable")}
                />
              </div>
            )}
          </section>

          {downloadError && !isDownloadLoading ? (
            <Alert variant="destructive" className="py-2">
              <AlertCircleIcon />
              <AlertDescription className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate">{downloadError}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => void downloadQuery.refetch()}
                >
                  <RefreshCwIcon data-icon="inline-start" />
                  {t("download.tryAgain")}
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
      </section>
    </main>
  )
}

function DownloadButton({
  download,
  label,
  unavailableLabel,
}: {
  download: AppDownloadResource | undefined
  label: string
  unavailableLabel: string
}) {
  if (!download) {
    return (
      <Button type="button" disabled className="w-full sm:w-auto sm:min-w-28">
        <DownloadIcon data-icon="inline-start" />
        {unavailableLabel}
      </Button>
    )
  }

  return (
    <Button asChild className="w-full sm:w-auto sm:min-w-28">
      <a href={download.url} download={download.file_name}>
        <DownloadIcon data-icon="inline-start" />
        {label}
      </a>
    </Button>
  )
}

function DownloadResultSkeleton() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <Skeleton className="mt-2 h-4 w-full max-w-md" />
        <Skeleton className="mt-2 h-3 w-56" />
      </div>
      <Skeleton className="h-9 w-full sm:w-32" />
    </div>
  )
}

function getDownloadMetaLine(
  download: AppDownloadResource,
  locale: Locale,
  t: (key: I18nKey) => string
) {
  return [
    `${t("download.version")} ${download.version || "-"}`,
    formatBytes(download.file_size),
    formatUpdatedAt(download.updated_at, locale),
  ].join(" · ")
}

function formatBytes(value: number) {
  if (!Number.isFinite(value)) {
    return "-"
  }

  const units = ["B", "KB", "MB", "GB", "TB"]
  let nextValue = value
  let unitIndex = 0

  while (nextValue >= 1024 && unitIndex < units.length - 1) {
    nextValue /= 1024
    unitIndex += 1
  }

  return `${nextValue.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function formatUpdatedAt(value: string | null | undefined, locale: Locale) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(date)
}

function getDownloadErrorMessage(error: unknown, t: (key: I18nKey) => string) {
  if (error instanceof HttpError && error.status === 404) {
    return t("download.noPackageForTarget")
  }

  return error instanceof Error ? error.message : t("common.loadFailed")
}
