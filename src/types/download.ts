export interface AppDownloadTarget {
  platform: string
  arch: string
  version?: string
}

export interface AppDownloadAssetResource {
  asset_id: number
  name: string
  platform: string
  arch: string
  format: string
  size: number
  download_url: string
  content_type: string | null
  updated_at: string | null
  digest: string | null
}

export interface AppDownloadReleaseResource {
  repository: string
  tag_name: string
  version: string
  name: string | null
  html_url: string
  published_at: string | null
  selected: AppDownloadAssetResource | null
  assets: AppDownloadAssetResource[]
}

export interface AppDownloadResource {
  platform: string
  arch: string
  url: string
  version: string
  file_name: string
  file_size: number
  updated_at: string | null
}
