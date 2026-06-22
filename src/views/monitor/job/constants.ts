import type {
  JobConcurrentFlag,
  JobMisfirePolicyFlag,
  StatusFlag,
} from "@/types/admin"

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
