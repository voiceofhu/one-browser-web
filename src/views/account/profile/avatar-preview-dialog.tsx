"use client"

import { useTranslation } from "@/components/providers/language-context"
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog"
import { translateAdminText } from "@/local"

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
  const { locale } = useTranslation()
  const tt = (text: string) => translateAdminText(locale, text)

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <ResponsiveDialogHeader className="border-b px-4 py-2 pr-12 text-left">
          <ResponsiveDialogTitle>{tt("头像预览")}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{title}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="grid min-h-0 place-items-center bg-muted/35 p-4">
          <img
            src={imageUrl}
            alt={tt("{title} 的头像").replace("{title}", title)}
            className="max-h-[70svh] max-w-full rounded-lg object-contain"
          />
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
