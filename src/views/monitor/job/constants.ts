import { enUSMonitorJobMessages } from "@/local/en-US/monitor-job"
import {
  zhCNMonitorJobMessages,
  type MonitorJobMessageKey,
} from "@/local/zh-CN/monitor-job"
import {
  DEFAULT_LOCALE,
  normalizeLocale,
  type I18nValues,
  type Locale,
} from "@/lib/i18n"
import type {
  JobConcurrentFlag,
  JobMisfirePolicyFlag,
  StatusFlag,
} from "@/types/admin"

const MONITOR_JOB_MESSAGES = {
  "zh-CN": zhCNMonitorJobMessages,
  "en-US": enUSMonitorJobMessages,
} satisfies Record<Locale, Record<MonitorJobMessageKey, string>>

export const JOB_STATUS_LABELS: Record<StatusFlag, string> = {
  "0": "启用",
  "1": "停用",
}

export const JOB_MISFIRE_POLICY_LABELS: Record<JobMisfirePolicyFlag, string> = {
  "1": "立即执行",
  "2": "执行一次",
  "3": "放弃执行",
}

export const JOB_CONCURRENT_LABELS: Record<JobConcurrentFlag, string> = {
  "0": "禁止并发",
  "1": "允许并发",
}

export const DEFAULT_JOB_INVOKE_TARGET = "system.healthcheck"

export const JOB_INVOKE_TARGET_VALUES = [
  "system.healthcheck",
  "scheduler.cleanup_job_logs",
] as const

export const JOB_INVOKE_TARGET_OPTIONS = [
  {
    value: JOB_INVOKE_TARGET_VALUES[0],
    label: "健康检查",
    description: "执行后台依赖健康检查。",
  },
  {
    value: JOB_INVOKE_TARGET_VALUES[1],
    label: "清理任务日志",
    description: "清理 30 天前的任务执行日志。",
  },
] as const

export const JOB_INVOKE_TARGET_LABELS: Record<string, string> = {
  "scheduler.noop": "空任务",
  ...JOB_INVOKE_TARGET_OPTIONS.reduce(
    (labels, option) => {
      labels[option.value] = option.label
      return labels
    },
    {} as Record<string, string>
  ),
}

export const JOB_MISFIRE_POLICY_OPTIONS = [
  { value: "1", label: JOB_MISFIRE_POLICY_LABELS["1"] },
  { value: "2", label: JOB_MISFIRE_POLICY_LABELS["2"] },
  { value: "3", label: JOB_MISFIRE_POLICY_LABELS["3"] },
] as const

export const JOB_CONCURRENT_OPTIONS = [
  { value: "0", label: JOB_CONCURRENT_LABELS["0"] },
  { value: "1", label: JOB_CONCURRENT_LABELS["1"] },
] as const

export const JOB_STATUS_OPTIONS = [
  { value: "0", label: JOB_STATUS_LABELS["0"] },
  { value: "1", label: JOB_STATUS_LABELS["1"] },
] as const

export function translateMonitorJob(
  locale: Locale | string | null | undefined,
  key: MonitorJobMessageKey,
  values?: I18nValues
) {
  const normalizedLocale = normalizeLocale(locale)
  const message =
    MONITOR_JOB_MESSAGES[normalizedLocale][key] ??
    MONITOR_JOB_MESSAGES[DEFAULT_LOCALE][key]

  if (!values) {
    return message
  }

  return message.replace(/\{(\w+)\}/g, (placeholder, name) => {
    const value = values[name]
    return value === undefined ? placeholder : String(value)
  })
}

export function getJobStatusLabel(
  locale: Locale | string | null | undefined,
  status: StatusFlag
) {
  return translateMonitorJob(
    locale,
    status === "0" ? "job.option.status.enabled" : "job.option.status.disabled"
  )
}

export function getJobMisfirePolicyLabel(
  locale: Locale | string | null | undefined,
  policy: JobMisfirePolicyFlag
) {
  switch (policy) {
    case "1":
      return translateMonitorJob(locale, "job.option.misfire.now")
    case "2":
      return translateMonitorJob(locale, "job.option.misfire.once")
    case "3":
      return translateMonitorJob(locale, "job.option.misfire.skip")
  }
}

export function getJobConcurrentLabel(
  locale: Locale | string | null | undefined,
  concurrent: JobConcurrentFlag
) {
  return translateMonitorJob(
    locale,
    concurrent === "0"
      ? "job.option.concurrent.disallow"
      : "job.option.concurrent.allow"
  )
}

export function getJobInvokeTargetLabel(
  locale: Locale | string | null | undefined,
  invokeTarget: string
) {
  switch (invokeTarget) {
    case "system.healthcheck":
      return translateMonitorJob(locale, "job.option.invoke.healthcheck")
    case "scheduler.cleanup_job_logs":
      return translateMonitorJob(locale, "job.option.invoke.cleanupLogs")
    case "scheduler.noop":
      return translateMonitorJob(locale, "job.option.invoke.noop")
    default:
      return invokeTarget
  }
}

export function translateJobScheduleError(
  locale: Locale | string | null | undefined,
  message: string
) {
  const key = JOB_SCHEDULE_ERROR_KEYS[message]
  return key ? translateMonitorJob(locale, key) : message
}

export function formatJobRunMessage(
  locale: Locale | string | null | undefined,
  message: string
) {
  if (!message) {
    return "-"
  }

  const cleanupMatch = message.match(
    /^removed (\d+) job logs older than 30 days$/
  )
  if (cleanupMatch) {
    return translateMonitorJob(locale, "job.message.cleanup", {
      count: cleanupMatch[1],
    })
  }

  const key = JOB_RUN_MESSAGE_KEYS[message]
  return key ? translateMonitorJob(locale, key) : message
}

export function getJobRunTriggerLabel(
  locale: Locale | string | null | undefined,
  trigger: string
) {
  switch (trigger) {
    case "手动":
      return translateMonitorJob(locale, "job.option.trigger.manual")
    case "自动":
      return translateMonitorJob(locale, "job.option.trigger.schedule")
    default:
      return trigger
  }
}

const JOB_SCHEDULE_ERROR_KEYS: Record<string, MonitorJobMessageKey> = {
  请输入执行表达式: "job.schedule.error.empty",
  "@every 仅支持 s、m、h，例如 @every 5m":
    "job.schedule.error.everyUnsupported",
  "@every 时间间隔必须大于 0": "job.schedule.error.everyPositive",
  "cron 表达式需要 5 个字段": "job.schedule.error.fieldCount",
  "cron 字段不能为空": "job.schedule.error.fieldEmpty",
  "cron 字段没有可执行值": "job.schedule.error.noValues",
  "cron 步长必须大于 0": "job.schedule.error.stepPositive",
  "cron 字段超出允许范围": "job.schedule.error.outOfRange",
  未能在有效范围内计算下次执行时间: "job.schedule.error.noNext",
}

const JOB_RUN_MESSAGE_KEYS: Record<string, MonitorJobMessageKey> = {
  "noop completed": "job.message.noop",
  "readiness check passed": "job.message.readinessPassed",
  "readiness check failed": "job.message.readinessFailed",
  "job log cleanup failed": "job.message.cleanupFailed",
  "PostgreSQL unavailable": "job.message.postgresUnavailable",
  "unsupported invoke_target": "job.message.unsupportedInvokeTarget",
  "job skipped": "job.message.skipped",
  空任务已完成: "job.message.noop",
  健康检查通过: "job.message.readinessPassed",
  健康检查失败: "job.message.readinessFailed",
  任务日志清理失败: "job.message.cleanupFailed",
  "PostgreSQL 不可用": "job.message.postgresUnavailable",
  不支持的调用目标: "job.message.unsupportedInvokeTarget",
  "上一轮仍在执行，已跳过本次任务": "job.message.skipped",
  等待健康检查返回: "job.message.waitingReadiness",
  "等待健康检查返回。": "job.message.waitingReadiness",
}
