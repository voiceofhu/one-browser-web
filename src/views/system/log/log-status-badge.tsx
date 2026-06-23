import { CheckCircle2Icon, XCircleIcon } from "lucide-react"

import { useTranslation } from "@/components/providers/language-context"
import { Badge } from "@/components/ui/badge"
import { translateAdminText } from "@/lib/i18n-admin"
import type { LogStatusFlag } from "@/types/admin"
import { LOG_STATUS_LABELS } from "@/views/system/log/constants"

export function LogStatusBadge({ status }: { status: LogStatusFlag }) {
  const { locale } = useTranslation()
  const isSuccess = status === "0"

  return (
    <Badge
      variant="outline"
      className={
        isSuccess
          ? "border-primary/20 bg-primary/10 text-primary"
          : "border-destructive/20 bg-destructive/10 text-destructive"
      }
    >
      {isSuccess ? (
        <CheckCircle2Icon data-icon="inline-start" />
      ) : (
        <XCircleIcon data-icon="inline-start" />
      )}
      {translateAdminText(locale, LOG_STATUS_LABELS[status])}
    </Badge>
  )
}
