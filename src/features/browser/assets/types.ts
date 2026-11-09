export interface BrowserAssetListParams {
  page?: number;
  page_size?: number;
  keyword?: string;
  platform?: string;
  arch?: string;
  current?: boolean;
}

export interface BrowserAssetPageResponse<T> {
  list: T[];
  total: number;
}

export interface BrowserAssetResource {
  asset_id: number;
  platform: string;
  arch: string;
  channel: string;
  version: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  sha256: string;
  bucket_id: string;
  object_key: string;
  download_url: string;
  upload_mode: 'direct' | 'multipart' | 'github_release' | (string & {});
  is_current: boolean;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string | null;
  remark: string;
}

export interface BrowserAssetUploadResource {
  upload_id: number;
  onefile_upload_id: string;
  platform: string;
  arch: string;
  channel: string;
  version: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  sha256: string;
  bucket_id: string;
  bucket_name: string | null;
  object_key: string;
  part_size: number;
  total_parts: number;
  make_current: boolean;
  status: 'uploading' | 'completed' | 'aborted' | (string & {});
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string | null;
  remark: string;
}

export interface BrowserAssetMultipartCreatePayload {
  platform: string;
  arch: string;
  channel?: string;
  version: string;
  file_name: string;
  file_size: number;
  sha256: string;
  mime_type: string;
  object_key?: string;
  part_size?: number;
  make_current?: boolean;
  remark?: string;
}

export interface BrowserAssetPartUploadResult {
  upload_id: number;
  part_number: number;
  etag: string | null;
  onefile: unknown;
}

export interface BrowserAssetCompletePayload {
  parts: Array<{
    part_number: number;
    etag: string;
  }>;
}

export interface BrowserAssetCompleteResult {
  asset: BrowserAssetResource;
  onefile: unknown;
}

export interface BrowserAssetGithubSyncResult {
  releases: number;
  created: number;
  updated: number;
  unchanged: number;
  made_current: number;
  skipped: number;
}
