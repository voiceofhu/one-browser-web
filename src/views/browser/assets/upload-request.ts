import {
  abortBrowserAssetUpload,
  completeBrowserAssetUpload,
  createBrowserAssetUpload,
  uploadBrowserAssetDirect,
} from "@/api/browser"
import {
  multipartProgressValue,
  resolveMultipartPartSize,
  resolveMultipartUploadPlan,
  uploadPartsConcurrently,
} from "./upload-multipart"
import type { BrowserAssetUploadFormValues } from "./upload-form"

const DIRECT_LIMIT_BYTES = 100 * 1024 * 1024
const DEFAULT_CHANNEL = "stable"

export type BrowserAssetUploadProgress = {
  label: string
  value: number
}

type UploadBrowserAssetPackageInput = {
  uploadFile: File
  values: BrowserAssetUploadFormValues
  onProgress: (progress: BrowserAssetUploadProgress) => void
}

export async function uploadBrowserAssetPackage({
  uploadFile,
  values,
  onProgress,
}: UploadBrowserAssetPackageInput) {
  if (uploadFile.size <= DIRECT_LIMIT_BYTES) {
    return uploadDirect(uploadFile, values, onProgress)
  }
  return uploadMultipart(uploadFile, values, onProgress)
}

async function uploadDirect(
  uploadFile: File,
  values: BrowserAssetUploadFormValues,
  onProgress: UploadBrowserAssetPackageInput["onProgress"]
) {
  onProgress({ label: "正在上传", value: 15 })
  const formData = new FormData()
  formData.set("platform", values.platform)
  formData.set("arch", values.arch)
  formData.set("channel", DEFAULT_CHANNEL)
  formData.set("version", values.version.trim())
  formData.set("sha256", values.sha256.trim().toLowerCase())
  formData.set("make_current", String(values.makeCurrent))
  formData.set("remark", values.remark.trim())
  formData.set("file", uploadFile)

  const asset = await uploadBrowserAssetDirect(formData)
  onProgress({ label: "已完成", value: 100 })
  return asset
}

async function uploadMultipart(
  uploadFile: File,
  values: BrowserAssetUploadFormValues,
  onProgress: UploadBrowserAssetPackageInput["onProgress"]
) {
  const partSizeBytes = resolveMultipartPartSize(uploadFile.size)
  onProgress({ label: "正在创建分片会话", value: 3 })
  const session = await createBrowserAssetUpload({
    platform: values.platform,
    arch: values.arch,
    channel: DEFAULT_CHANNEL,
    version: values.version.trim(),
    file_name: uploadFile.name,
    file_size: uploadFile.size,
    sha256: values.sha256.trim().toLowerCase(),
    mime_type: uploadFile.type || "application/octet-stream",
    part_size: partSizeBytes,
    make_current: values.makeCurrent,
    remark: values.remark.trim(),
  })
  try {
    const { partSize: actualPartSize, totalParts } = resolveMultipartUploadPlan(
      {
        fileSize: uploadFile.size,
        requestedPartSize: partSizeBytes,
        sessionPartSize: session.part_size,
        sessionTotalParts: session.total_parts,
      }
    )

    const parts = await uploadPartsConcurrently({
      uploadFile,
      uploadId: session.upload_id,
      partSizeBytes: actualPartSize,
      totalParts,
      onProgress: ({ completedParts, totalParts, concurrency, retry }) => {
        onProgress({
          label: retry
            ? `第 ${retry.partNumber} 个分片上传失败，正在重试 ${retry.attempt}/${retry.maxRetries}`
            : `正在上传分片 ${completedParts}/${totalParts}（并发 ${concurrency}）`,
          value: multipartProgressValue(completedParts, totalParts),
        })
      },
    })

    onProgress({ label: "正在完成上传", value: 96 })
    const completed = await completeBrowserAssetUpload(session.upload_id, {
      parts,
    })
    onProgress({ label: "已完成", value: 100 })
    return completed.asset
  } catch (error) {
    await abortBrowserAssetUpload(session.upload_id).catch(() => undefined)
    throw error
  }
}
