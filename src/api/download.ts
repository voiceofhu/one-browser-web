import { buildApiUrl, buildQueryPath, HttpError, http } from "@/lib/request"
import type {
  AppDownloadReleaseResource,
  AppDownloadResource,
  AppDownloadTarget,
} from "@/types/download"

const APP_DOWNLOAD_PATH = "/app-downloads/latest"

export async function getLatestAppDownload(target: AppDownloadTarget) {
  const release = await http.get<AppDownloadReleaseResource>(
    buildQueryPath(APP_DOWNLOAD_PATH, target)
  )
  const selected = release.selected
  if (!selected) {
    throw new HttpError(
      404,
      "APP_DOWNLOAD_NOT_CONFIGURED",
      "app download is not configured"
    )
  }

  return {
    platform: selected.platform,
    arch: selected.arch,
    url: resolveAppDownloadUrl(selected.download_url),
    version: release.version,
    file_name: selected.name,
    file_size: selected.size,
    updated_at: selected.updated_at ?? release.published_at,
  } satisfies AppDownloadResource
}

function resolveAppDownloadUrl(url: string) {
  if (/^https?:\/\//.test(url)) {
    return url
  }

  return buildApiUrl(url.replace(/^\/api(?=\/)/, ""))
}
