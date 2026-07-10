"use client"

import * as React from "react"
import { UploadIcon } from "lucide-react"

import {
  abortBrowserAssetUpload,
  completeBrowserAssetUpload,
  createBrowserAssetUpload,
  uploadBrowserAssetDirect,
} from "@/api/browser"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DialogActionButton } from "@/components/ui/dialog-action-button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { BrowserAssetResource } from "@/types/browser"
import {
  multipartProgressValue,
  resolveMultipartPartSize,
  resolveMultipartUploadPlan,
  uploadPartsConcurrently,
} from "./upload-multipart"

const DIRECT_LIMIT_BYTES = 100 * 1024 * 1024
const DEFAULT_CHANNEL = "stable"
const CHROMIUM_ASSET_NAME_PATTERN =
  /^one-browser-chromium-(macos|windows)-(arm64|x64)-(\d+\.\d+\.\d+\.\d+)\.tar\.gz$/i

type BrowserAssetUploadDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploaded: (asset: BrowserAssetResource) => void
}

type UploadProgress = {
  label: string
  value: number
}

export function BrowserAssetUploadDialog({
  open,
  onOpenChange,
  onUploaded,
}: BrowserAssetUploadDialogProps) {
  const [platform, setPlatform] = React.useState("macos")
  const [arch, setArch] = React.useState("arm64")
  const [version, setVersion] = React.useState("")
  const [remark, setRemark] = React.useState("")
  const [makeCurrent, setMakeCurrent] = React.useState(true)
  const [file, setFile] = React.useState<File | null>(null)
  const [fileNameError, setFileNameError] = React.useState("")
  const [error, setError] = React.useState("")
  const [progress, setProgress] = React.useState<UploadProgress | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const fileInputId = React.useId()

  const canSubmit =
    Boolean(file) && Boolean(version.trim()) && !fileNameError && !isSubmitting

  function handleOpenChange(nextOpen: boolean) {
    if (isSubmitting) {
      return
    }
    onOpenChange(nextOpen)
    if (!nextOpen) {
      resetForm()
    }
  }

  function resetForm() {
    setPlatform("macos")
    setArch("arm64")
    setVersion("")
    setRemark("")
    setMakeCurrent(true)
    setFile(null)
    setFileNameError("")
    setError("")
    setProgress(null)
    setIsSubmitting(false)
  }

  function handleFileChange(nextFile: File | null) {
    setFile(nextFile)
    setError("")
    setFileNameError("")

    if (!nextFile) {
      setVersion("")
      return
    }

    const parsed = parseChromiumAssetFileName(nextFile.name)
    if (!parsed) {
      setVersion("")
      setFileNameError(
        "文件名需符合 one-browser-chromium-{platform}-{arch}-{version}.tar.gz"
      )
      return
    }

    setPlatform(parsed.platform)
    setArch(parsed.arch)
    setVersion(parsed.version)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    if (!file) {
      setError("请选择安装包文件")
      return
    }
    if (file.size <= 0) {
      setError("安装包文件不能为空")
      return
    }
    const parsed = parseChromiumAssetFileName(file.name)
    if (!parsed) {
      setFileNameError(
        "文件名需符合 one-browser-chromium-{platform}-{arch}-{version}.tar.gz"
      )
      return
    }
    setPlatform(parsed.platform)
    setArch(parsed.arch)
    setVersion(parsed.version)

    setIsSubmitting(true)
    try {
      const asset =
        resolveUploadMode(file) === "direct"
          ? await uploadDirect(file)
          : await uploadMultipart(file)
      onUploaded(asset)
      handleOpenChange(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : "上传失败")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function uploadDirect(uploadFile: File) {
    setProgress({ label: "正在上传", value: 15 })
    const formData = new FormData()
    formData.set("platform", platform)
    formData.set("arch", arch)
    formData.set("channel", DEFAULT_CHANNEL)
    formData.set("version", version.trim())
    formData.set("make_current", String(makeCurrent))
    formData.set("remark", remark.trim())
    formData.set("file", uploadFile)

    const asset = await uploadBrowserAssetDirect(formData)
    setProgress({ label: "已完成", value: 100 })
    return asset
  }

  async function uploadMultipart(uploadFile: File) {
    const partSizeBytes = resolveMultipartPartSize(uploadFile.size)
    setProgress({ label: "正在创建分片会话", value: 3 })
    const session = await createBrowserAssetUpload({
      platform,
      arch,
      channel: DEFAULT_CHANNEL,
      version: version.trim(),
      file_name: uploadFile.name,
      file_size: uploadFile.size,
      mime_type: uploadFile.type || "application/octet-stream",
      part_size: partSizeBytes,
      make_current: makeCurrent,
      remark: remark.trim(),
    })
    try {
      const { partSize: actualPartSize, totalParts } =
        resolveMultipartUploadPlan({
          fileSize: uploadFile.size,
          requestedPartSize: partSizeBytes,
          sessionPartSize: session.part_size,
          sessionTotalParts: session.total_parts,
        })

      const parts = await uploadPartsConcurrently({
        uploadFile,
        uploadId: session.upload_id,
        partSizeBytes: actualPartSize,
        totalParts,
        onProgress: ({ completedParts, totalParts, concurrency }) => {
          setProgress({
            label: `正在上传分片 ${completedParts}/${totalParts}（并发 ${concurrency}）`,
            value: multipartProgressValue(completedParts, totalParts),
          })
        },
      })

      setProgress({ label: "正在完成上传", value: 96 })
      const completed = await completeBrowserAssetUpload(session.upload_id, {
        parts,
      })
      setProgress({ label: "已完成", value: 100 })
      return completed.asset
    } catch (error) {
      await abortBrowserAssetUpload(session.upload_id).catch(() => undefined)
      throw error
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[86svh] overflow-hidden p-0 sm:max-w-xl">
        <form
          onSubmit={handleSubmit}
          className="flex max-h-[86svh] min-h-0 flex-col"
        >
          <DialogHeader className="gap-0.5 border-b-0 bg-muted/50 px-4 py-2 pr-12 text-left">
            <DialogTitle className="text-sm font-semibold">
              上传安装包
            </DialogTitle>
            <DialogDescription className="text-xs/relaxed">
              小包可直传，大包使用分片上传到 OneFile 后设为客户端下载版本。
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-auto px-4 py-3">
            <FieldGroup className="gap-3">
              {error ? (
                <Alert variant="destructive">
                  <AlertTitle>上传失败</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField
                  label="运行平台"
                  value={platform}
                  onValueChange={setPlatform}
                  options={[
                    { label: "macOS", value: "macos" },
                    { label: "Windows", value: "windows" },
                  ]}
                  disabled={isSubmitting || Boolean(file)}
                />
                <SelectField
                  label="架构"
                  value={arch}
                  onValueChange={setArch}
                  options={[
                    { label: "arm64", value: "arm64" },
                    { label: "x64", value: "x64" },
                  ]}
                  disabled={isSubmitting || Boolean(file)}
                />
                <TextField
                  label="版本"
                  value={version}
                  onChange={setVersion}
                  placeholder="例如 126.0.6478.127"
                  disabled={isSubmitting}
                  readOnly
                  className="sm:col-span-2"
                />
              </div>

              <Field>
                <FieldLabel htmlFor={fileInputId}>安装包文件</FieldLabel>
                <Input
                  id={fileInputId}
                  type="file"
                  disabled={isSubmitting}
                  onChange={(event) =>
                    handleFileChange(event.currentTarget.files?.[0] ?? null)
                  }
                />
                <FieldDescription className="text-xs/relaxed">
                  {fileNameError
                    ? fileNameError
                    : file
                      ? `${file.name} · ${formatBytes(file.size)}`
                      : "请选择 make gz 生成的 one-browser-chromium-*.tar.gz 安装包。"}
                </FieldDescription>
              </Field>

              <Field orientation="horizontal" className="items-center gap-2">
                <Switch
                  checked={makeCurrent}
                  onCheckedChange={setMakeCurrent}
                  disabled={isSubmitting}
                  size="sm"
                />
                <FieldLabel>设为当前版本</FieldLabel>
              </Field>

              <Field>
                <FieldLabel>备注</FieldLabel>
                <Textarea
                  value={remark}
                  onChange={(event) => setRemark(event.target.value)}
                  disabled={isSubmitting}
                  placeholder="可选"
                  className="min-h-16 resize-none"
                />
              </Field>

              {progress ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {progress.label}
                    </span>
                    <span>{progress.value}%</span>
                  </div>
                  <Progress value={progress.value} />
                </div>
              ) : null}
            </FieldGroup>
          </div>

          <DialogFooter className="mx-0 mb-0 shrink-0 rounded-b-xl border-t-0 bg-muted/50 px-4 py-2">
            <DialogActionButton
              type="button"
              action="cancel"
              disabled={isSubmitting}
              onClick={() => handleOpenChange(false)}
            >
              取消
            </DialogActionButton>
            <DialogActionButton
              type="submit"
              disabled={!canSubmit}
              loading={isSubmitting}
              loadingText="上传中"
            >
              <UploadIcon data-icon="inline-start" />
              上传
            </DialogActionButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

type SelectFieldProps = {
  label: string
  value: string
  onValueChange: (value: string) => void
  options: readonly { label: string; value: string }[]
  disabled?: boolean
}

function SelectField({
  label,
  value,
  onValueChange,
  options,
  disabled,
}: SelectFieldProps) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  )
}

type TextFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  className?: string
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  readOnly,
  className,
}: TextFieldProps) {
  return (
    <Field className={className}>
      <FieldLabel>{label}</FieldLabel>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
      />
    </Field>
  )
}

function resolveUploadMode(file: File) {
  return file.size <= DIRECT_LIMIT_BYTES ? "direct" : "multipart"
}

function parseChromiumAssetFileName(fileName: string) {
  const match = CHROMIUM_ASSET_NAME_PATTERN.exec(fileName.trim())
  if (!match) {
    return null
  }

  return {
    platform: match[1].toLowerCase(),
    arch: match[2].toLowerCase(),
    version: match[3],
  }
}

function formatBytes(value: number) {
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
