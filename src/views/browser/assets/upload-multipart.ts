import { uploadBrowserAssetPart } from "@/api/browser"
import type { BrowserAssetCompletePayload } from "@/types/browser"

const FALLBACK_CPU_COUNT = 2

type UploadedMultipartPart = BrowserAssetCompletePayload["parts"][number]

export type MultipartUploadProgress = {
  completedParts: number
  totalParts: number
  concurrency: number
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

  return Math.max(1, Math.min(totalParts, cpuCount * 2))
}
