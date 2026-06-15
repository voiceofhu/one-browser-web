"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

import { RoleMultiSelect } from "./role-multi-select"
import { showResourceError } from "./toast"

type RecordDialogProps<TData> = {
  open: boolean
  record: TData | null
  getName: (record: TData) => string
  onOpenChange: (open: boolean) => void
}

export function ResetPasswordDialog<TData>({
  open,
  record,
  getName,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: RecordDialogProps<TData> & {
  isSubmitting: boolean
  onSubmit: (record: TData, password: string) => Promise<void>
}) {
  const [password, setPassword] = React.useState("")
  const [confirmation, setConfirmation] = React.useState("")
  const [error, setError] = React.useState("")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!record) {
      return
    }
    if (password.length < 10) {
      setError("密码至少需要 10 位")
      return
    }
    if (password !== confirmation) {
      setError("两次输入的密码不一致")
      return
    }

    setError("")
    try {
      await onSubmit(record, password)
    } catch (submitError) {
      showResourceError(submitError)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
            <DialogDescription>
              为“{record ? getName(record) : ""}”设置新的登录密码。
            </DialogDescription>
          </DialogHeader>
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="reset-user-password">新密码</FieldLabel>
            <Input
              id="reset-user-password"
              type="password"
              value={password}
              disabled={isSubmitting}
              autoComplete="new-password"
              onChange={(event) => setPassword(event.target.value)}
            />
            <FieldDescription>至少 10 位，保存后立即生效。</FieldDescription>
          </Field>
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="confirm-user-password">确认密码</FieldLabel>
            <Input
              id="confirm-user-password"
              type="password"
              value={confirmation}
              disabled={isSubmitting}
              autoComplete="new-password"
              onChange={(event) => setConfirmation(event.target.value)}
            />
            <FieldError>{error}</FieldError>
          </Field>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                取消
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
              确认重置
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function RoleAssignmentDialog<TData>({
  open,
  record,
  getName,
  getRoleIds,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: RecordDialogProps<TData> & {
  getRoleIds: (record: TData) => Promise<number[]>
  isSubmitting: boolean
  onSubmit: (record: TData, roleIds: number[]) => Promise<void>
}) {
  const rolesQuery = useQuery({
    queryKey: ["system", "users", "role-assignment", record],
    queryFn: () => getRoleIds(record as TData),
    enabled: open && record != null,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>重新分配角色</DialogTitle>
          <DialogDescription>
            调整“{record ? getName(record) : ""}”拥有的系统角色。
          </DialogDescription>
        </DialogHeader>
        {rolesQuery.isError ? (
          <div className="grid min-h-32 place-items-center gap-3 text-center">
            <FieldError>角色绑定加载失败，请稍后重试。</FieldError>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => rolesQuery.refetch()}
            >
              重新加载
            </Button>
          </div>
        ) : record && rolesQuery.data ? (
          <RoleAssignmentForm
            key={rolesQuery.data.join("-")}
            record={record}
            initialRoleIds={rolesQuery.data}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
          />
        ) : (
          <div className="flex min-h-32 items-center justify-center">
            <Spinner />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function RoleAssignmentForm<TData>({
  record,
  initialRoleIds,
  isSubmitting,
  onSubmit,
}: {
  record: TData
  initialRoleIds: number[]
  isSubmitting: boolean
  onSubmit: (record: TData, roleIds: number[]) => Promise<void>
}) {
  const [roleIds, setRoleIds] = React.useState(initialRoleIds)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (roleIds.length === 0) {
      toast.error("请至少选择一个角色", { duration: 5_000 })
      return
    }

    try {
      await onSubmit(record, roleIds)
    } catch (submitError) {
      showResourceError(submitError)
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <Field>
        <FieldLabel>角色</FieldLabel>
        <RoleMultiSelect
          value={roleIds}
          disabled={isSubmitting}
          onChange={setRoleIds}
        />
      </Field>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={isSubmitting}>
            取消
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
          保存角色
        </Button>
      </DialogFooter>
    </form>
  )
}
