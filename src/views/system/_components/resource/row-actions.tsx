import {
  EditIcon,
  KeyRoundIcon,
  MoreHorizontalIcon,
  Trash2Icon,
  UserRoundCheckIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type RowActionsProps = {
  noun: string
  onEdit?: () => void
  onDelete?: () => void
  onResetPassword?: () => void
  onAssignRoles?: () => void
}

export function RowActions({
  noun,
  onEdit,
  onDelete,
  onResetPassword,
  onAssignRoles,
}: RowActionsProps) {
  const hasActions = Boolean(
    onEdit || onDelete || onResetPassword || onAssignRoles
  )

  if (!hasActions) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" className="size-7">
          <MoreHorizontalIcon />
          <span className="sr-only">{noun}操作</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuGroup>
          {onEdit ? (
            <DropdownMenuItem onSelect={onEdit}>
              <EditIcon />
              编辑
            </DropdownMenuItem>
          ) : null}
          {onDelete ? (
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2Icon />
              删除
            </DropdownMenuItem>
          ) : null}
          {onResetPassword ? (
            <DropdownMenuItem onSelect={onResetPassword}>
              <KeyRoundIcon />
              重置密码
            </DropdownMenuItem>
          ) : null}
          {onAssignRoles ? (
            <DropdownMenuItem onSelect={onAssignRoles}>
              <UserRoundCheckIcon />
              重新分配角色
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
