import { http } from '@/lib/http';

import type {
  BrowserAssetCompletePayload,
  BrowserAssetCompleteResult,
  BrowserAssetGithubSyncResult,
  BrowserAssetListParams,
  BrowserAssetMultipartCreatePayload,
  BrowserAssetPageResponse,
  BrowserAssetPartUploadResult,
  BrowserAssetResource,
  BrowserAssetUploadResource,
} from '../types';

const browserAssetPath = '/browser/assets';

function cleanParams(params?: BrowserAssetListParams) {
  if (!params) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined),
  ) as Record<string, string | number | boolean>;
}

export async function listBrowserAssets(params?: BrowserAssetListParams) {
  const response = await http.get<
    BrowserAssetPageResponse<BrowserAssetResource>
  >(browserAssetPath, cleanParams(params));
  return response.data;
}

export async function uploadBrowserAssetDirect(formData: FormData) {
  const response = await http.upload<BrowserAssetResource>(
    `${browserAssetPath}/uploads/direct`,
    formData,
  );
  return response.data;
}

export async function createBrowserAssetUpload(
  payload: BrowserAssetMultipartCreatePayload,
) {
  const response = await http.post<
    BrowserAssetUploadResource,
    BrowserAssetMultipartCreatePayload
  >(`${browserAssetPath}/uploads`, payload);
  return response.data;
}

export async function uploadBrowserAssetPart(
  uploadId: number,
  partNumber: number,
  chunk: Blob,
  signal?: AbortSignal,
) {
  const response = await http.post<BrowserAssetPartUploadResult, Blob>(
    `${browserAssetPath}/uploads/${uploadId}/parts`,
    chunk,
    { params: { part_number: partNumber }, signal },
  );
  return response.data;
}

export async function completeBrowserAssetUpload(
  uploadId: number,
  payload: BrowserAssetCompletePayload,
) {
  const response = await http.post<
    BrowserAssetCompleteResult,
    BrowserAssetCompletePayload
  >(`${browserAssetPath}/uploads/${uploadId}/complete`, payload);
  return response.data;
}

export async function abortBrowserAssetUpload(uploadId: number) {
  const response = await http.post<BrowserAssetUploadResource>(
    `${browserAssetPath}/uploads/${uploadId}/abort`,
  );
  return response.data;
}

export async function setCurrentBrowserAsset(assetId: number) {
  const response = await http.put<BrowserAssetResource>(
    `${browserAssetPath}/${assetId}/current`,
  );
  return response.data;
}

export async function deleteBrowserAsset(assetId: number) {
  await http.delete<void>(`${browserAssetPath}/${assetId}`);
}

export async function syncBrowserAssetsFromGithub() {
  const response = await http.post<BrowserAssetGithubSyncResult>(
    `${browserAssetPath}/sync-github`,
  );
  return response.data;
}
