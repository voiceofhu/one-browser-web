import { z } from "zod"

const CHROMIUM_VERSION_PATTERN = /^\d+\.\d+\.\d+\.\d+$/
const SHA256_PATTERN = /^[0-9a-f]{64}$/i
const CHROMIUM_ASSET_NAME_PATTERN =
  /^one-browser-chromium-(macos|windows)-(arm64|x64)-(\d+\.\d+\.\d+\.\d+)\.tar\.gz$/i

export type BrowserAssetPlatform = "macos" | "windows"
export type BrowserAssetArch = "arm64" | "x64"

const archiveFileSchema = z.custom<File | null>().superRefine((file, ctx) => {
  if (!isFile(file)) {
    ctx.addIssue({ code: "custom", message: "请选择安装包" })
    return
  }
  if (file.size <= 0) {
    ctx.addIssue({ code: "custom", message: "安装包文件不能为空" })
  }
  if (!parseChromiumAssetFileName(file.name)) {
    ctx.addIssue({
      code: "custom",
      message:
        "文件名需符合 one-browser-chromium-{platform}-{arch}-{version}.tar.gz",
    })
  }
})

export const browserAssetUploadSchema = z.object({
  file: archiveFileSchema,
  platform: z.enum(["macos", "windows"]),
  arch: z.enum(["arm64", "x64"]),
  version: z
    .string()
    .trim()
    .min(1, "请输入版本")
    .regex(CHROMIUM_VERSION_PATTERN, "版本需为四段数字，例如 148.0.7778.178"),
  sha256: z
    .string()
    .trim()
    .min(1, "请输入 SHA-256")
    .regex(SHA256_PATTERN, "SHA-256 必须是 64 位十六进制字符串"),
  makeCurrent: z.boolean(),
  remark: z.string(),
})

export type BrowserAssetUploadFormValues = z.infer<
  typeof browserAssetUploadSchema
>

export const DEFAULT_BROWSER_ASSET_UPLOAD_FORM_VALUES = {
  file: null,
  platform: "macos",
  arch: "arm64",
  version: "",
  sha256: "",
  makeCurrent: true,
  remark: "",
} satisfies BrowserAssetUploadFormValues

export function parseChromiumAssetFileName(fileName: string) {
  const match = CHROMIUM_ASSET_NAME_PATTERN.exec(fileName.trim())
  if (!match) {
    return null
  }

  return {
    platform: match[1].toLowerCase() as BrowserAssetPlatform,
    arch: match[2].toLowerCase() as BrowserAssetArch,
    version: match[3],
  }
}

export async function readSha256Sidecar(file: File, archiveName: string) {
  const line = (await file.text()).trim().split(/\r?\n/, 1)[0] ?? ""
  const match = /^([0-9a-f]{64})(?:\s+\*?(.+))?$/i.exec(line)
  if (!match) {
    throw new Error("SHA-256 文件格式无效")
  }

  const declaredFileName = match[2]?.trim()
  if (declaredFileName && declaredFileName !== archiveName) {
    throw new Error(`SHA-256 文件对应的是 ${declaredFileName}`)
  }

  return match[1].toLowerCase()
}

export function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B"
  }

  const units = ["B", "KiB", "MiB", "GiB", "TiB"] as const
  let size = value
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function isFile(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File
}
