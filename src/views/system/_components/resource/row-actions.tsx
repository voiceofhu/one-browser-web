import {
  EditIcon,
  KeyRoundIcon,
  MoreHorizontalIcon,
  PlusIcon,
  Trash2Icon,
  UserRoundCheckIcon,
} from "lucide-react"

import { useTranslation } from "@/components/providers/language-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { translateText } from "@/lib/i18n-text"

type RowActionsProps = {
  noun: string
  onEdit?: () => void
  onDelete?: () => void
  onCreateChild?: () => void
  onResetPassword?: () => void
  onAssignRoles?: () => void
}

export function RowActions({
  noun,
  onEdit,
  onDelete,
  onCreateChild,
  onResetPassword,
  onAssignRoles,
}: RowActionsProps) {
  const { locale, t } = useTranslation()
  const hasActions = Boolean(
    onEdit || onDelete || onCreateChild || onResetPassword || onAssignRoles
  )

  if (!hasActions) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" className="size-7">
          <MoreHorizontalIcon />
          <span className="sr-only">
            {translateText(locale, noun)}
            {t("common.actions")}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuGroup>
          {onCreateChild ? (
            <DropdownMenuItem onSelect={onCreateChild}>
              <PlusIcon />
              {t("common.create")}
            </DropdownMenuItem>
          ) : null}
          {onEdit ? (
            <DropdownMenuItem onSelect={onEdit}>
              <EditIcon />
              {translateText(locale, "编辑")}
            </DropdownMenuItem>
          ) : null}
          {onDelete ? (
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2Icon />
              {t("common.delete")}
            </DropdownMenuItem>
          ) : null}
          {onResetPassword ? (
            <DropdownMenuItem onSelect={onResetPassword}>
              <KeyRoundIcon />
              {translateText(locale, "重置密码")}
            </DropdownMenuItem>
          ) : null}
          {onAssignRoles ? (
            <DropdownMenuItem onSelect={onAssignRoles}>
              <UserRoundCheckIcon />
              {translateText(locale, "重新分配角色")}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
