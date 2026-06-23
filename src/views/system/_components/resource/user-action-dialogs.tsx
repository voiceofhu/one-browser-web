"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { toast } from "sonner"

import { useTranslation } from "@/components/providers/language-context"
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
  const { locale, t } = useTranslation()
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!record) {
      return
    }
    if (password.length < 10) {
      setError(t("resource.resetPassword.minLength"))
      return
    }
    setError("")
    try {
      await onSubmit(record, password)
    } catch (submitError) {
      showResourceError(submitError, locale)
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <form
          className="flex min-h-0 flex-1 flex-col gap-0 md:gap-4"
          onSubmit={handleSubmit}
        >
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {t("resource.resetPassword.title")}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {t("resource.resetPassword.description", {
                name: record ? getName(record) : "",
              })}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="reset-user-password">
                {t("resource.resetPassword.newPassword")}
              </FieldLabel>
              <div className="relative">
                <Input
                  id="reset-user-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                  className="pr-10"
                  onChange={(event) => setPassword(event.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={isSubmitting}
                  aria-label={
                    showPassword
                      ? t("login.hidePassword")
                      : t("login.showPassword")
                  }
                  className="absolute top-1/2 right-1 size-7 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </Button>
              </div>
              <FieldDescription>
                {t("resource.resetPassword.help")}
              </FieldDescription>
              <FieldError>{error}</FieldError>
            </Field>
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <ResponsiveDialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                {t("common.cancel")}
              </Button>
            </ResponsiveDialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
              {t("resource.resetPassword.confirm")}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
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
  const { locale, t } = useTranslation()
  const rolesQuery = useQuery({
    queryKey: ["system", "users", "role-assignment", record],
    queryFn: () => getRoleIds(record as TData),
    enabled: open && record != null,
  })

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {t("resource.assignRoles.title")}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {t("resource.assignRoles.description", {
              name: record ? getName(record) : "",
            })}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        {rolesQuery.isError ? (
          <ResponsiveDialogBody className="grid min-h-32 place-items-center gap-3 text-center">
            <FieldError>{t("resource.assignRoles.loadFailed")}</FieldError>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => rolesQuery.refetch()}
            >
              {t("resource.assignRoles.reload")}
            </Button>
          </ResponsiveDialogBody>
        ) : record && rolesQuery.data ? (
          <RoleAssignmentForm
            key={rolesQuery.data.join("-")}
            record={record}
            initialRoleIds={rolesQuery.data}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
            locale={locale}
          />
        ) : (
          <ResponsiveDialogBody className="flex min-h-32 items-center justify-center">
            <Spinner />
          </ResponsiveDialogBody>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

function RoleAssignmentForm<TData>({
  record,
  initialRoleIds,
  isSubmitting,
  onSubmit,
  locale,
}: {
  record: TData
  initialRoleIds: number[]
  isSubmitting: boolean
  onSubmit: (record: TData, roleIds: number[]) => Promise<void>
  locale: ReturnType<typeof useTranslation>["locale"]
}) {
  const { t } = useTranslation()
  const [roleIds, setRoleIds] = React.useState(initialRoleIds)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (roleIds.length === 0) {
      toast.error(t("resource.assignRoles.roleRequired"), { duration: 5_000 })
      return
    }

    try {
      await onSubmit(record, roleIds)
    } catch (submitError) {
      showResourceError(submitError, locale)
    }
  }

  return (
    <form
      className="flex min-h-0 flex-1 flex-col gap-0 md:gap-4"
      onSubmit={handleSubmit}
    >
      <ResponsiveDialogBody>
        <Field>
          <FieldLabel>{t("resource.assignRoles.role")}</FieldLabel>
          <RoleMultiSelect
            value={roleIds}
            disabled={isSubmitting}
            onChange={setRoleIds}
          />
        </Field>
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <ResponsiveDialogClose asChild>
          <Button type="button" variant="outline" disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
        </ResponsiveDialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
          {t("resource.assignRoles.save")}
        </Button>
      </ResponsiveDialogFooter>
    </form>
  )
}
