"use client"

import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog"

type AvatarPreviewDialogProps = {
  open: boolean
  imageUrl: string
  title: string
  onOpenChange: (open: boolean) => void
}

export function AvatarPreviewDialog({
  open,
  imageUrl,
  title,
  onOpenChange,
}: AvatarPreviewDialogProps) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <ResponsiveDialogHeader className="border-b px-4 py-2 pr-12 text-left">
          <ResponsiveDialogTitle>头像预览</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{title}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="grid min-h-0 place-items-center bg-muted/35 p-4">
          <img
            src={imageUrl}
            alt={`${title} 的头像`}
            className="max-h-[70svh] max-w-full rounded-lg object-contain"
          />
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
