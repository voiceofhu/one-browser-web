"use client"

import * as React from "react"
import {
  ImageUpIcon,
  MinusIcon,
  PlusIcon,
  RotateCcwIcon,
  SaveIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog"
import { Slider } from "@/components/ui/slider"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

const AVATAR_OUTPUT_SIZE = 240
const CROP_VIEW_SIZE = 280
const MIN_SCALE = 1
const MAX_SCALE = 3
const SCALE_STEP = 0.1

type CropPosition = {
  x: number
  y: number
}

type ImageSize = {
  width: number
  height: number
}

type DragState = {
  pointerId: number
  startX: number
  startY: number
  origin: CropPosition
}

type AvatarCropDialogProps = {
  open: boolean
  imageUrl: string | null
  fileName: string
  isSubmitting?: boolean
  onOpenChange: (open: boolean) => void
  onSelectFile: () => void
  onSubmit: (file: File) => void | Promise<void>
}

export function AvatarCropDialog({
  open,
  imageUrl,
  fileName,
  isSubmitting = false,
  onOpenChange,
  onSelectFile,
  onSubmit,
}: AvatarCropDialogProps) {
  const imageRef = React.useRef<HTMLImageElement>(null)
  const dragRef = React.useRef<DragState | null>(null)
  const [imageSize, setImageSize] = React.useState<ImageSize | null>(null)
  const [scale, setScale] = React.useState(MIN_SCALE)
  const [position, setPosition] = React.useState<CropPosition>({ x: 0, y: 0 })
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const cropRect = imageSize
    ? getDrawnRect(imageSize, scale, position, CROP_VIEW_SIZE)
    : null

  React.useEffect(() => {
    setImageSize(null)
    setScale(MIN_SCALE)
    setPosition({ x: 0, y: 0 })
    setPreviewUrl(null)
    dragRef.current = null
    setIsDragging(false)
  }, [imageUrl])

  React.useEffect(() => {
    if (!imageUrl || !imageSize || !imageRef.current) {
      setPreviewUrl(null)
      return
    }

    const frame = window.requestAnimationFrame(() => {
      const image = imageRef.current

      if (!image) {
        return
      }

      const canvas = drawAvatarCanvas(
        image,
        imageSize,
        scale,
        position,
        AVATAR_OUTPUT_SIZE
      )
      setPreviewUrl(canvas.toDataURL("image/png"))
    })

    return () => window.cancelAnimationFrame(frame)
  }, [imageSize, imageUrl, position, scale])

  function handleImageLoad(event: React.SyntheticEvent<HTMLImageElement>) {
    setImageSize({
      width: event.currentTarget.naturalWidth,
      height: event.currentTarget.naturalHeight,
    })
    setScale(MIN_SCALE)
    setPosition({ x: 0, y: 0 })
  }

  function updateScale(nextScale: number) {
    const normalizedScale = clamp(nextScale, MIN_SCALE, MAX_SCALE)
    setScale(normalizedScale)
    setPosition((currentPosition) =>
      imageSize
        ? clampPosition(currentPosition, imageSize, normalizedScale)
        : currentPosition
    )
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!imageSize || isSubmitting) {
      return
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: position,
    }
    setIsDragging(true)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const dragState = dragRef.current

    if (!dragState || !imageSize || dragState.pointerId !== event.pointerId) {
      return
    }

    setPosition(
      clampPosition(
        {
          x: dragState.origin.x + event.clientX - dragState.startX,
          y: dragState.origin.y + event.clientY - dragState.startY,
        },
        imageSize,
        scale
      )
    )
  }

  function handlePointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null
      setIsDragging(false)
    }
  }

  function handleReset() {
    setScale(MIN_SCALE)
    setPosition({ x: 0, y: 0 })
  }

  async function handleSubmit() {
    if (!imageRef.current || !imageSize) {
      toast.error("请选择头像图片")
      return
    }

    try {
      const canvas = drawAvatarCanvas(
        imageRef.current,
        imageSize,
        scale,
        position,
        AVATAR_OUTPUT_SIZE
      )
      const blob = await canvasToBlob(canvas)
      const avatarFile = new File([blob], avatarFileName(fileName), {
        type: blob.type || "image/png",
      })

      await onSubmit(avatarFile)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "头像裁剪失败")
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <ResponsiveDialogHeader className="border-b px-4 py-2 pr-12 text-left">
          <ResponsiveDialogTitle>修改头像</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            选择图片后裁剪为方形头像，提交后才会上传。
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="p-4">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_13rem]">
            <div className="flex min-w-0 flex-col gap-3">
              <div
                className={cn(
                  "relative mx-auto touch-none overflow-hidden rounded-lg bg-muted ring-1 ring-border select-none",
                  imageSize && !isSubmitting ? "cursor-grab" : "cursor-default",
                  isDragging ? "cursor-grabbing" : null
                )}
                style={{ width: CROP_VIEW_SIZE, height: CROP_VIEW_SIZE }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
                onPointerCancel={handlePointerEnd}
              >
                {imageUrl ? (
                  <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="待裁剪头像"
                    draggable={false}
                    className="absolute max-w-none select-none"
                    style={
                      cropRect
                        ? {
                            width: cropRect.width,
                            height: cropRect.height,
                            transform: `translate3d(${cropRect.left}px, ${cropRect.top}px, 0)`,
                          }
                        : undefined
                    }
                    onLoad={handleImageLoad}
                  />
                ) : (
                  <div className="grid size-full place-items-center text-sm text-muted-foreground">
                    请选择图片
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-background/80 ring-inset" />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="缩小"
                  disabled={!imageSize || isSubmitting || scale <= MIN_SCALE}
                  onClick={() => updateScale(scale - SCALE_STEP)}
                >
                  <MinusIcon />
                </Button>
                <Slider
                  value={[scale]}
                  min={MIN_SCALE}
                  max={MAX_SCALE}
                  step={SCALE_STEP}
                  disabled={!imageSize || isSubmitting}
                  aria-label="头像缩放"
                  onValueChange={([value]) => updateScale(value ?? MIN_SCALE)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="放大"
                  disabled={!imageSize || isSubmitting || scale >= MAX_SCALE}
                  onClick={() => updateScale(scale + SCALE_STEP)}
                >
                  <PlusIcon />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={onSelectFile}
                >
                  <ImageUpIcon data-icon="inline-start" />
                  选择图片
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={!imageSize || isSubmitting}
                  onClick={handleReset}
                >
                  <RotateCcwIcon data-icon="inline-start" />
                  重置
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-lg bg-background p-3">
              <div className="text-sm font-medium">头像预览</div>
              <div className="flex flex-col items-center gap-3">
                <Avatar className="size-24">
                  <AvatarImage src={previewUrl ?? undefined} alt="头像预览" />
                  <AvatarFallback>预览</AvatarFallback>
                </Avatar>
                <p className="text-center text-xs text-muted-foreground">
                  拖动图片调整位置，使用缩放控制头像范围。
                </p>
              </div>
            </div>
          </div>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <ResponsiveDialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              取消
            </Button>
          </ResponsiveDialogClose>
          <Button
            type="button"
            disabled={!imageSize || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <SaveIcon data-icon="inline-start" />
            )}
            提交
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

function getDrawnRect(
  imageSize: ImageSize,
  scale: number,
  position: CropPosition,
  viewportSize: number
) {
  const baseScale =
    Math.max(viewportSize / imageSize.width, viewportSize / imageSize.height) *
    scale
  const width = imageSize.width * baseScale
  const height = imageSize.height * baseScale

  return {
    width,
    height,
    left: (viewportSize - width) / 2 + position.x,
    top: (viewportSize - height) / 2 + position.y,
  }
}

function clampPosition(
  position: CropPosition,
  imageSize: ImageSize,
  scale: number
): CropPosition {
  const rect = getDrawnRect(imageSize, scale, { x: 0, y: 0 }, CROP_VIEW_SIZE)
  const maxX = Math.max((rect.width - CROP_VIEW_SIZE) / 2, 0)
  const maxY = Math.max((rect.height - CROP_VIEW_SIZE) / 2, 0)

  return {
    x: clamp(position.x, -maxX, maxX),
    y: clamp(position.y, -maxY, maxY),
  }
}

function drawAvatarCanvas(
  image: HTMLImageElement | null,
  imageSize: ImageSize,
  scale: number,
  position: CropPosition,
  outputSize: number
) {
  if (!image) {
    throw new Error("头像图片加载失败")
  }

  const canvas = document.createElement("canvas")
  canvas.width = outputSize
  canvas.height = outputSize
  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("当前浏览器不支持头像裁剪")
  }

  const baseScale =
    Math.max(outputSize / imageSize.width, outputSize / imageSize.height) *
    scale
  const width = imageSize.width * baseScale
  const height = imageSize.height * baseScale
  const offsetScale = outputSize / CROP_VIEW_SIZE
  const left = (outputSize - width) / 2 + position.x * offsetScale
  const top = (outputSize - height) / 2 + position.y * offsetScale

  context.clearRect(0, 0, outputSize, outputSize)
  context.drawImage(image, left, top, width, height)

  return canvas
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("头像裁剪失败"))
        return
      }

      resolve(blob)
    }, "image/png")
  })
}

function avatarFileName(fileName: string) {
  const trimmedName = fileName.trim()
  const baseName = trimmedName ? trimmedName.replace(/\.[^.]*$/, "") : "avatar"

  return `${baseName || "avatar"}.png`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
