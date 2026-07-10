import { uploadBrowserAssetPart } from "@/api/browser"
import type { BrowserAssetCompletePayload } from "@/types/browser"

const FALLBACK_CPU_COUNT = 2
const MAX_UPLOAD_CONCURRENCY = 6
const MEBIBYTE_BYTES = 1024 * 1024
const GIBIBYTE_BYTES = 1024 * MEBIBYTE_BYTES
const R2_MIN_PART_SIZE_BYTES = 5 * MEBIBYTE_BYTES
const R2_MAX_PART_SIZE_BYTES = 5 * GIBIBYTE_BYTES - 5 * MEBIBYTE_BYTES
const R2_MAX_PARTS = 10_000
const API_MAX_PART_SIZE_BYTES = 128 * MEBIBYTE_BYTES
const MAX_PART_SIZE_BYTES = Math.min(
  API_MAX_PART_SIZE_BYTES,
  R2_MAX_PART_SIZE_BYTES
)
const DEFAULT_PART_SIZE_BYTES = 16 * MEBIBYTE_BYTES
const LARGE_PART_SIZE_BYTES = 32 * MEBIBYTE_BYTES
const EXTRA_LARGE_PART_SIZE_BYTES = 64 * MEBIBYTE_BYTES

type UploadedMultipartPart = BrowserAssetCompletePayload["parts"][number]

export type MultipartUploadProgress = {
  completedParts: number
  totalParts: number
  concurrency: number
}

export function resolveMultipartPartSize(fileSize: number) {
  if (!Number.isSafeInteger(fileSize) || fileSize <= 0) {
    throw new Error("文件大小无效")
  }

  const preferredPartSize =
    fileSize >= 4 * GIBIBYTE_BYTES
      ? EXTRA_LARGE_PART_SIZE_BYTES
      : fileSize >= GIBIBYTE_BYTES
        ? LARGE_PART_SIZE_BYTES
        : DEFAULT_PART_SIZE_BYTES
  const minimumPartSize = Math.ceil(fileSize / R2_MAX_PARTS)
  const partSize = roundUpToMebibyte(
    Math.max(R2_MIN_PART_SIZE_BYTES, preferredPartSize, minimumPartSize)
  )

  if (partSize > MAX_PART_SIZE_BYTES) {
    throw new Error(
      "文件过大：当前上传接口最多支持 10,000 个、每个 128 MiB 的分片"
    )
  }

  return partSize
}

export function resolveMultipartUploadPlan({
  fileSize,
  requestedPartSize,
  sessionPartSize,
  sessionTotalParts,
}: {
  fileSize: number
  requestedPartSize: number
  sessionPartSize?: number
  sessionTotalParts?: number
}) {
  const partSize = sessionPartSize ?? requestedPartSize
  if (
    !Number.isSafeInteger(partSize) ||
    partSize < R2_MIN_PART_SIZE_BYTES ||
    partSize > MAX_PART_SIZE_BYTES
  ) {
    throw new Error("服务端返回的分片大小不符合 R2 上传限制")
  }

  const totalParts = Math.ceil(fileSize / partSize)
  if (totalParts <= 0 || totalParts > R2_MAX_PARTS) {
    throw new Error("分片数量必须在 1 到 10,000 之间")
  }
  if (sessionTotalParts !== undefined && sessionTotalParts !== totalParts) {
    throw new Error("服务端返回的分片数量与文件大小不一致")
  }

  return { partSize, totalParts }
}

export async function uploadPartsConcurrently({
  uploadFile,
  uploadId,
  partSizeBytes,
  totalParts,
  onProgress,
}: {
  uploadFile: File
  uploadId: number
  partSizeBytes: number
  totalParts: number
  onProgress: (progress: MultipartUploadProgress) => void
}) {
  const concurrency = resolveUploadConcurrency(totalParts)
  const uploadedParts: Array<UploadedMultipartPart | undefined> = new Array(
    totalParts
  )
  let nextPartIndex = 0
  let completedParts = 0
  let stopped = false

  onProgress({ completedParts, totalParts, concurrency })

  async function worker() {
    while (!stopped) {
      const index = nextPartIndex
      nextPartIndex += 1

      if (index >= totalParts) {
        return
      }

      const partNumber = index + 1
      const start = index * partSizeBytes
      const end = Math.min(start + partSizeBytes, uploadFile.size)
      const chunk = uploadFile.slice(start, end)

      try {
        const uploaded = await uploadBrowserAssetPart(
          uploadId,
          partNumber,
          chunk
        )
        if (!uploaded.etag) {
          throw new Error(`第 ${partNumber} 个分片未返回 ETag`)
        }

        uploadedParts[index] = {
          part_number: partNumber,
          etag: uploaded.etag,
        }
        completedParts += 1
        onProgress({ completedParts, totalParts, concurrency })
      } catch (error) {
        stopped = true
        throw error
      }
    }
  }

  const results = await Promise.allSettled(
    Array.from({ length: concurrency }, () => worker())
  )
  const failed = results.find(
    (result): result is PromiseRejectedResult => result.status === "rejected"
  )

  if (failed) {
    throw failed.reason instanceof Error
      ? failed.reason
      : new Error("分片上传失败")
  }

  return uploadedParts.map((part, index) => {
    if (!part) {
      throw new Error(`第 ${index + 1} 个分片未完成`)
    }

    return part
  })
}

export function multipartProgressValue(
  completedParts: number,
  totalParts: number
) {
  if (totalParts <= 0) {
    return 5
  }

  return Math.min(
    93,
    Math.max(5, Math.floor((completedParts / totalParts) * 88) + 5)
  )
}

function resolveUploadConcurrency(totalParts: number) {
  const hardwareConcurrency =
    typeof navigator === "undefined" ? undefined : navigator.hardwareConcurrency
  const cpuCount =
    typeof hardwareConcurrency === "number" &&
    Number.isFinite(hardwareConcurrency) &&
    hardwareConcurrency > 0
      ? Math.floor(hardwareConcurrency)
      : FALLBACK_CPU_COUNT

  return Math.max(1, Math.min(totalParts, MAX_UPLOAD_CONCURRENCY, cpuCount * 2))
}

function roundUpToMebibyte(value: number) {
  return Math.ceil(value / MEBIBYTE_BYTES) * MEBIBYTE_BYTES
}
