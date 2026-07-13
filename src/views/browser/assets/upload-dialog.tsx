"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { FolderOpenIcon, UploadIcon } from "lucide-react"
import {
  Controller,
  useForm,
  useWatch,
  type FieldError as HookFormFieldError,
} from "react-hook-form"

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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
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
  DEFAULT_BROWSER_ASSET_UPLOAD_FORM_VALUES,
  browserAssetUploadSchema,
  formatBytes,
  parseChromiumAssetFileName,
  readSha256Sidecar,
  type BrowserAssetUploadFormValues,
} from "./upload-form"
import {
  uploadBrowserAssetPackage,
  type BrowserAssetUploadProgress,
} from "./upload-request"

type BrowserAssetUploadDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploaded: (asset: BrowserAssetResource) => void
}

export function BrowserAssetUploadDialog({
  open,
  onOpenChange,
  onUploaded,
}: BrowserAssetUploadDialogProps) {
  const [checksumFileName, setChecksumFileName] = React.useState("")
  const [error, setError] = React.useState("")
  const [progress, setProgress] =
    React.useState<BrowserAssetUploadProgress | null>(null)
  const archiveInputRef = React.useRef<HTMLInputElement>(null)
  const checksumInputRef = React.useRef<HTMLInputElement>(null)
  const archiveNameInputId = React.useId()
  const archiveFileInputId = React.useId()
  const sha256InputId = React.useId()
  const checksumFileInputId = React.useId()
  const platformInputId = React.useId()
  const archInputId = React.useId()
  const versionInputId = React.useId()
  const makeCurrentInputId = React.useId()
  const remarkInputId = React.useId()
  const form = useForm<BrowserAssetUploadFormValues>({
    resolver: zodResolver(browserAssetUploadSchema),
    defaultValues: DEFAULT_BROWSER_ASSET_UPLOAD_FORM_VALUES,
  })
  const file =
    useWatch({ control: form.control, name: "file" }) ??
    DEFAULT_BROWSER_ASSET_UPLOAD_FORM_VALUES.file
  const { errors, isSubmitting } = form.formState

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
    form.reset(DEFAULT_BROWSER_ASSET_UPLOAD_FORM_VALUES)
    setChecksumFileName("")
    setError("")
    setProgress(null)
  }

  function handleArchiveSelection(files: FileList | null) {
    const nextFile = files?.item(0) ?? null
    const shouldValidate = form.formState.submitCount > 0
    form.setValue("file", nextFile, {
      shouldDirty: true,
      shouldValidate: true,
    })
    form.setValue("sha256", "", {
      shouldDirty: true,
      shouldValidate,
    })
    form.clearErrors("sha256")
    setChecksumFileName("")
    setError("")
    if (checksumInputRef.current) {
      checksumInputRef.current.value = ""
    }

    if (!nextFile) {
      form.setValue("version", "", { shouldDirty: true, shouldValidate })
      return
    }

    const parsed = parseChromiumAssetFileName(nextFile.name)
    if (!parsed) {
      form.setValue("version", "", { shouldDirty: true, shouldValidate })
      return
    }

    form.setValue("platform", parsed.platform, {
      shouldDirty: true,
      shouldValidate,
    })
    form.setValue("arch", parsed.arch, {
      shouldDirty: true,
      shouldValidate,
    })
    form.setValue("version", parsed.version, {
      shouldDirty: true,
      shouldValidate,
    })
  }

  async function handleChecksumSelection(files: FileList | null) {
    const checksumFile = files?.item(0)
    if (!checksumFile) {
      return
    }
    const archive = form.getValues("file")
    if (!archive) {
      form.setError("file", {
        type: "manual",
        message: "请先选择安装包",
      })
      if (checksumInputRef.current) {
        checksumInputRef.current.value = ""
      }
      return
    }

    try {
      const sha256 = await readSha256Sidecar(checksumFile, archive.name)
      form.setValue("sha256", sha256, {
        shouldDirty: true,
        shouldValidate: true,
      })
      form.clearErrors("sha256")
      setChecksumFileName(checksumFile.name)
    } catch (selectionError) {
      setChecksumFileName(checksumFile.name)
      form.setError("sha256", {
        type: "manual",
        message:
          selectionError instanceof Error
            ? selectionError.message
            : "SHA-256 文件读取失败",
      })
    }
  }

  async function handleSubmit(values: BrowserAssetUploadFormValues) {
    setError("")
    const uploadFile = values.file
    if (!uploadFile) {
      return
    }

    try {
      const asset = await uploadBrowserAssetPackage({
        uploadFile,
        values,
        onProgress: setProgress,
      })
      onUploaded(asset)
      onOpenChange(false)
      resetForm()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "上传失败")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[86svh] overflow-hidden p-0 sm:max-w-2xl">
        <form
          noValidate
          onSubmit={form.handleSubmit(handleSubmit)}
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
            <FieldGroup className="gap-4">
              {error ? (
                <Alert variant="destructive">
                  <AlertTitle>上传失败</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <Field data-invalid={Boolean(errors.file)}>
                <RequiredFieldLabel htmlFor={archiveNameInputId} required>
                  选择安装包
                </RequiredFieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id={archiveNameInputId}
                    value={file?.name ?? ""}
                    placeholder="请选择 .tar.gz 安装包"
                    readOnly
                    aria-invalid={Boolean(errors.file)}
                    aria-required="true"
                    className="truncate"
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      size="sm"
                      disabled={isSubmitting}
                      aria-controls={archiveFileInputId}
                      onClick={() => archiveInputRef.current?.click()}
                    >
                      <FolderOpenIcon data-icon="inline-start" />
                      选择文件
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                <input
                  ref={archiveInputRef}
                  id={archiveFileInputId}
                  type="file"
                  accept=".tar.gz,application/gzip"
                  className="sr-only"
                  disabled={isSubmitting}
                  aria-label="选择安装包文件"
                  onChange={(event) =>
                    handleArchiveSelection(event.currentTarget.files)
                  }
                />
                <FieldDescription className="text-xs/relaxed">
                  {file
                    ? `${file.name} · ${formatBytes(file.size)}`
                    : "支持 make build/build-win 生成的 .tar.gz 文件。"}
                </FieldDescription>
                <FieldError errors={[errors.file]} />
              </Field>

              <Controller
                control={form.control}
                name="sha256"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <RequiredFieldLabel htmlFor={sha256InputId} required>
                      SHA-256
                    </RequiredFieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        {...field}
                        id={sha256InputId}
                        placeholder="64 位十六进制校验值"
                        disabled={isSubmitting}
                        aria-invalid={fieldState.invalid}
                        aria-required="true"
                        onChange={(event) => {
                          field.onChange(event)
                          form.clearErrors("sha256")
                          setChecksumFileName("")
                        }}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          size="sm"
                          disabled={isSubmitting}
                          aria-controls={checksumFileInputId}
                          onClick={() => checksumInputRef.current?.click()}
                        >
                          <FolderOpenIcon data-icon="inline-start" />
                          选择文件
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                    <input
                      ref={checksumInputRef}
                      id={checksumFileInputId}
                      type="file"
                      accept=".sha256,text/plain"
                      className="sr-only"
                      disabled={isSubmitting}
                      aria-label="选择 SHA-256 校验文件"
                      onChange={(event) =>
                        void handleChecksumSelection(event.currentTarget.files)
                      }
                    />
                    <FieldDescription className="text-xs/relaxed">
                      {checksumFileName
                        ? `已从 ${checksumFileName} 读取，可继续手动修改。`
                        : "可以手动输入，也可以选择同名 .sha256 文件自动读取。"}
                    </FieldDescription>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <FieldGroup className="grid gap-3 sm:grid-cols-2">
                <Controller
                  control={form.control}
                  name="platform"
                  render={({ field, fieldState }) => (
                    <SelectField
                      id={platformInputId}
                      label="运行平台"
                      value={field.value}
                      onValueChange={field.onChange}
                      options={[
                        { label: "macOS", value: "macos" },
                        { label: "Windows", value: "windows" },
                      ]}
                      disabled={isSubmitting}
                      error={fieldState.error}
                      required
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name="arch"
                  render={({ field, fieldState }) => (
                    <SelectField
                      id={archInputId}
                      label="架构"
                      value={field.value}
                      onValueChange={field.onChange}
                      options={[
                        { label: "arm64", value: "arm64" },
                        { label: "x64", value: "x64" },
                      ]}
                      disabled={isSubmitting}
                      error={fieldState.error}
                      required
                    />
                  )}
                />
                <Field
                  className="sm:col-span-2"
                  data-invalid={Boolean(errors.version)}
                >
                  <RequiredFieldLabel htmlFor={versionInputId} required>
                    版本
                  </RequiredFieldLabel>
                  <Input
                    id={versionInputId}
                    {...form.register("version")}
                    placeholder="例如 148.0.7778.178"
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.version)}
                    aria-required="true"
                  />
                  <FieldDescription className="text-xs/relaxed">
                    从安装包文件名自动识别，也可以手动修改。
                  </FieldDescription>
                  <FieldError errors={[errors.version]} />
                </Field>
              </FieldGroup>

              <Controller
                control={form.control}
                name="makeCurrent"
                render={({ field }) => (
                  <Field
                    orientation="horizontal"
                    className="items-center gap-2"
                  >
                    <Switch
                      id={makeCurrentInputId}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                      size="sm"
                    />
                    <FieldLabel htmlFor={makeCurrentInputId}>
                      设为当前版本
                    </FieldLabel>
                  </Field>
                )}
              />

              <Field>
                <FieldLabel htmlFor={remarkInputId}>备注</FieldLabel>
                <Textarea
                  id={remarkInputId}
                  {...form.register("remark")}
                  disabled={isSubmitting}
                  placeholder="可选"
                  className="min-h-16 resize-none"
                />
              </Field>

              {progress ? (
                <Field className="gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {progress.label}
                    </span>
                    <span>{progress.value}%</span>
                  </div>
                  <Progress value={progress.value} />
                </Field>
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
              disabled={isSubmitting}
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
  id: string
  label: string
  value: string
  onValueChange: (value: string) => void
  options: readonly { label: string; value: string }[]
  disabled?: boolean
  error?: HookFormFieldError
  required?: boolean
}

function SelectField({
  id,
  label,
  value,
  onValueChange,
  options,
  disabled,
  error,
  required,
}: SelectFieldProps) {
  return (
    <Field data-invalid={Boolean(error)}>
      <RequiredFieldLabel htmlFor={id} required={required}>
        {label}
      </RequiredFieldLabel>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          id={id}
          className="w-full"
          aria-invalid={Boolean(error)}
          aria-required={required}
        >
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
      <FieldError errors={[error]} />
    </Field>
  )
}

function RequiredFieldLabel({
  children,
  required,
  ...props
}: React.ComponentProps<typeof FieldLabel> & { required?: boolean }) {
  return (
    <FieldLabel {...props}>
      {children}
      {required ? (
        <span className="text-destructive" aria-hidden="true">
          *
        </span>
      ) : null}
    </FieldLabel>
  )
}
