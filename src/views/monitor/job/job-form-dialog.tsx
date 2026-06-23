"use client"

import * as React from "react"
import { CheckIcon, CircleHelpIcon, CopyIcon, SaveIcon } from "lucide-react"
import { toast } from "sonner"

import { useTranslation } from "@/components/providers/language-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Input } from "@/components/ui/input"
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { formatAbsoluteDateTime } from "@/lib/datetime"
import type { Locale } from "@/local"
import type { JobPayload, JobResource } from "@/types/admin"

import {
  DEFAULT_JOB_INVOKE_TARGET,
  getJobConcurrentLabel,
  getJobInvokeTargetLabel,
  getJobMisfirePolicyLabel,
  getJobStatusLabel,
  JOB_CONCURRENT_OPTIONS,
  JOB_INVOKE_TARGET_OPTIONS,
  JOB_MISFIRE_POLICY_OPTIONS,
  JOB_STATUS_OPTIONS,
  translateJobScheduleError,
  translateMonitorJob,
} from "./constants"
import { getNextScheduleTimes } from "./schedule-preview"

type JobFormDialogProps = {
  open: boolean
  record: JobResource | null
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: JobPayload) => void
}

const EMPTY_JOB_FORM: JobPayload = {
  job_name: "",
  job_group: "DEFAULT",
  invoke_target: DEFAULT_JOB_INVOKE_TARGET,
  cron_expression: "@every 5m",
  misfire_policy: "3",
  concurrent: "1",
  status: "0",
  remark: "",
}

export function JobFormDialog({
  open,
  record,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: JobFormDialogProps) {
  const { locale, t } = useTranslation()
  const [form, setForm] = React.useState<JobPayload>(EMPTY_JOB_FORM)
  const title = translateMonitorJob(
    locale,
    record ? "job.form.editTitle" : "job.form.createTitle"
  )
  const schedulePreview = React.useMemo(
    () => getNextScheduleTimes(form.cron_expression),
    [form.cron_expression]
  )

  React.useEffect(() => {
    if (!open) {
      return
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- The form must reset to the selected job when the dialog opens.
    setForm(record ? jobToPayload(record) : EMPTY_JOB_FORM)
  }, [open, record])

  function updateField<TKey extends keyof JobPayload>(
    key: TKey,
    value: JobPayload[TKey]
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = normalizePayload(form)

    if (!payload.job_name) {
      toast.error(translateMonitorJob(locale, "job.form.validation.jobName"))
      return
    }
    if (!payload.invoke_target) {
      toast.error(
        translateMonitorJob(locale, "job.form.validation.invokeTarget")
      )
      return
    }
    if (!payload.cron_expression) {
      toast.error(
        translateMonitorJob(locale, "job.form.validation.cronExpression")
      )
      return
    }
    if (!getNextScheduleTimes(payload.cron_expression).ok) {
      toast.error(
        translateMonitorJob(locale, "job.form.validation.invalidCron")
      )
      return
    }

    onSubmit(payload)
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-h-[88svh] p-0 sm:max-w-2xl">
        <form className="flex max-h-[88svh] flex-col" onSubmit={handleSubmit}>
          <ResponsiveDialogHeader className="border-b px-5 py-3 text-left">
            <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {translateMonitorJob(locale, "job.form.description")}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="job-name">
                  {translateMonitorJob(locale, "job.form.jobName")}
                </FieldLabel>
                <Input
                  id="job-name"
                  value={form.job_name}
                  placeholder={translateMonitorJob(
                    locale,
                    "job.form.jobNamePlaceholder"
                  )}
                  onChange={(event) =>
                    updateField("job_name", event.target.value)
                  }
                />
              </Field>

              <Field>
                <FieldLabel>
                  {translateMonitorJob(locale, "job.form.invokeTarget")}
                </FieldLabel>
                <Select
                  value={form.invoke_target}
                  onValueChange={(value) =>
                    updateField(
                      "invoke_target",
                      value as JobPayload["invoke_target"]
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={translateMonitorJob(
                        locale,
                        "job.form.invokeTargetPlaceholder"
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {JOB_INVOKE_TARGET_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {getJobInvokeTargetLabel(locale, option.value)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  {translateMonitorJob(locale, "job.form.invokeTargetHelp")}
                </FieldDescription>
              </Field>

              <Field>
                <div className="flex items-center gap-1">
                  <FieldLabel htmlFor="cron-expression">
                    {translateMonitorJob(locale, "job.form.cronExpression")}
                  </FieldLabel>
                  <ScheduleExpressionHelp locale={locale} />
                </div>
                <Input
                  id="cron-expression"
                  value={form.cron_expression}
                  placeholder={translateMonitorJob(
                    locale,
                    "job.form.cronExpressionPlaceholder"
                  )}
                  onChange={(event) =>
                    updateField("cron_expression", event.target.value)
                  }
                />
                <FieldDescription>
                  {translateMonitorJob(locale, "job.form.cronHelp")}
                </FieldDescription>
                <SchedulePreview locale={locale} result={schedulePreview} />
              </Field>

              <div className="grid gap-4 md:grid-cols-3">
                <Field>
                  <FieldLabel>
                    {translateMonitorJob(locale, "job.form.misfirePolicy")}
                  </FieldLabel>
                  <Select
                    value={form.misfire_policy}
                    onValueChange={(value) =>
                      updateField(
                        "misfire_policy",
                        value as JobPayload["misfire_policy"]
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={translateMonitorJob(
                          locale,
                          "job.form.misfirePolicyPlaceholder"
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {JOB_MISFIRE_POLICY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {getJobMisfirePolicyLabel(locale, option.value)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>
                    {translateMonitorJob(locale, "job.form.concurrent")}
                  </FieldLabel>
                  <Select
                    value={form.concurrent}
                    onValueChange={(value) =>
                      updateField(
                        "concurrent",
                        value as JobPayload["concurrent"]
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={translateMonitorJob(
                          locale,
                          "job.form.concurrentPlaceholder"
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {JOB_CONCURRENT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {getJobConcurrentLabel(locale, option.value)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>
                    {translateMonitorJob(locale, "job.form.status")}
                  </FieldLabel>
                  <Select
                    value={form.status}
                    onValueChange={(value) =>
                      updateField("status", value as JobPayload["status"])
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={translateMonitorJob(
                          locale,
                          "job.form.statusPlaceholder"
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {JOB_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {getJobStatusLabel(locale, option.value)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="job-remark">
                  {translateMonitorJob(locale, "job.form.remark")}
                </FieldLabel>
                <Textarea
                  id="job-remark"
                  value={form.remark}
                  placeholder={translateMonitorJob(
                    locale,
                    "job.form.remarkPlaceholder"
                  )}
                  onChange={(event) =>
                    updateField("remark", event.target.value)
                  }
                />
              </Field>
            </FieldGroup>
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter className="mx-0 mb-0 shrink-0 rounded-b-xl bg-muted/50 px-5 py-3">
            <ResponsiveDialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                {t("common.cancel")}
              </Button>
            </ResponsiveDialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <SaveIcon data-icon="inline-start" />
              )}
              {record
                ? translateMonitorJob(locale, "job.form.saveChanges")
                : t("common.create")}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

function jobToPayload(record: JobResource): JobPayload {
  const knownInvokeTarget = JOB_INVOKE_TARGET_OPTIONS.some(
    (option) => option.value === record.invoke_target
  )

  return {
    job_name: record.job_name,
    job_group: "DEFAULT",
    invoke_target: knownInvokeTarget
      ? record.invoke_target
      : DEFAULT_JOB_INVOKE_TARGET,
    cron_expression: record.cron_expression,
    misfire_policy: record.misfire_policy,
    concurrent: record.concurrent,
    status: record.status,
    remark: record.remark,
  }
}

function normalizePayload(payload: JobPayload): JobPayload {
  return {
    job_name: payload.job_name.trim(),
    job_group: "DEFAULT",
    invoke_target: payload.invoke_target.trim(),
    cron_expression: payload.cron_expression.trim(),
    misfire_policy: payload.misfire_policy,
    concurrent: payload.concurrent,
    status: payload.status,
    remark: payload.remark.trim(),
  }
}

function SchedulePreview({
  locale,
  result,
}: {
  locale: Locale
  result: ReturnType<typeof getNextScheduleTimes>
}) {
  if (!result.ok) {
    return (
      <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {translateJobScheduleError(locale, result.message)}
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-lg bg-muted/50 px-3 py-2">
      <div className="text-xs text-muted-foreground">
        {translateMonitorJob(locale, "job.schedule.nextThreeRuns")}
      </div>
      <div className="flex flex-wrap gap-2">
        {result.times.map((time) => (
          <Badge key={time.toISOString()} variant="secondary">
            {formatAbsoluteDateTime(time.toISOString(), "-")}
          </Badge>
        ))}
      </div>
    </div>
  )
}

const SCHEDULE_EXAMPLES = [
  { labelKey: "job.schedule.example.every5m", value: "@every 5m" },
  { labelKey: "job.schedule.example.hourly", value: "@hourly" },
  { labelKey: "job.schedule.example.daily2", value: "0 2 * * *" },
  { labelKey: "job.schedule.example.weekday9", value: "0 9 * * 1-5" },
  { labelKey: "job.schedule.example.monthly1", value: "0 3 1 * *" },
] as const

function ScheduleExpressionHelp({ locale }: { locale: Locale }) {
  const [copiedValue, setCopiedValue] = React.useState<string | null>(null)
  const resetTimerRef = React.useRef<number | null>(null)

  React.useEffect(
    () => () => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current)
      }
    },
    []
  )

  async function copyExample(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedValue(value)
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current)
      }
      resetTimerRef.current = window.setTimeout(() => {
        setCopiedValue((current) => (current === value ? null : current))
      }, 2_000)
      toast.success(translateMonitorJob(locale, "job.schedule.copySuccess"))
    } catch {
      toast.error(translateMonitorJob(locale, "job.schedule.copyFailed"))
    }
  }

  return (
    <HoverCard openDelay={120}>
      <HoverCardTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground"
          aria-label={translateMonitorJob(locale, "job.schedule.helpAria")}
        >
          <CircleHelpIcon />
        </Button>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-80">
        <div className="flex flex-col gap-3">
          <div>
            <div className="font-medium">
              {translateMonitorJob(locale, "job.schedule.helpTitle")}
            </div>
            <div className="mt-1 text-muted-foreground">
              {translateMonitorJob(locale, "job.schedule.helpDescription")}
            </div>
          </div>
          <div className="grid gap-2">
            {SCHEDULE_EXAMPLES.map((example) => {
              const copied = copiedValue === example.value
              const label = translateMonitorJob(locale, example.labelKey)

              return (
                <div
                  key={example.value}
                  className="grid grid-cols-[7rem_minmax(0,1fr)_1.75rem] items-center gap-2"
                >
                  <span className="text-muted-foreground">{label}</span>
                  <code className="rounded-md bg-muted px-2 py-1 font-mono text-xs">
                    {example.value}
                  </code>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={translateMonitorJob(
                      locale,
                      "job.schedule.copyExample",
                      { label }
                    )}
                    onClick={() => void copyExample(example.value)}
                  >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
