export type SchedulePreviewResult =
  | {
      ok: true
      times: Date[]
    }
  | {
      ok: false
      message: string
    }

type CronField = Set<number> | null
type DurationParseResult =
  | { ok: true; ms: number }
  | { ok: false; message: string }
type CronParseResult =
  | ({ ok: true } & CronExpression)
  | { ok: false; message: string }
type CronFieldParseResult =
  | { ok: true; values: CronField }
  | { ok: false; message: string }
type CronPartParseResult =
  | { ok: true; values: number[] }
  | { ok: false; message: string }

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export function getNextScheduleTimes(
  expression: string,
  count = 3,
  from = new Date()
): SchedulePreviewResult {
  const value = expression.trim()
  if (!value) {
    return { ok: false, message: "请输入执行表达式" }
  }

  if (value.toLowerCase() === "@hourly") {
    return nextEvery(HOUR, count, from)
  }

  if (value.toLowerCase() === "@daily") {
    return nextDaily(count, from)
  }

  if (value.toLowerCase().startsWith("@every ")) {
    const duration = parseEveryDuration(value.slice(7))
    if (!duration.ok) {
      return duration
    }
    return nextEvery(duration.ms, count, from)
  }

  const cron = parseCron(value)
  if (!cron.ok) {
    return cron
  }

  const times: Date[] = []
  let cursor = new Date(from.getTime())
  cursor.setSeconds(0, 0)
  cursor = new Date(cursor.getTime() + MINUTE)

  const deadline = cursor.getTime() + Math.max(count, 1) * 366 * DAY
  while (times.length < count && cursor.getTime() <= deadline) {
    if (matchesCron(cron, cursor)) {
      times.push(new Date(cursor))
    }
    cursor = new Date(cursor.getTime() + MINUTE)
  }

  if (times.length === 0) {
    return { ok: false, message: "未能在有效范围内计算下次执行时间" }
  }

  return { ok: true, times }
}

function nextEvery(
  duration: number,
  count: number,
  from: Date
): SchedulePreviewResult {
  const base = Math.floor(from.getTime() / duration) * duration
  return {
    ok: true,
    times: Array.from(
      { length: count },
      (_, index) => new Date(base + duration * (index + 1))
    ),
  }
}

function nextDaily(count: number, from: Date): SchedulePreviewResult {
  const next = new Date(from)
  next.setHours(0, 0, 0, 0)
  if (next.getTime() <= from.getTime()) {
    next.setDate(next.getDate() + 1)
  }

  return {
    ok: true,
    times: Array.from({ length: count }, (_, index) => {
      const time = new Date(next)
      time.setDate(next.getDate() + index)
      return time
    }),
  }
}

function parseEveryDuration(value: string): DurationParseResult {
  const match = value.trim().match(/^(\d+)\s*([smh])$/i)
  if (!match) {
    return { ok: false, message: "@every 仅支持 s、m、h，例如 @every 5m" }
  }

  const amount = Number(match[1])
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return { ok: false, message: "@every 时间间隔必须大于 0" }
  }

  const unit = match[2].toLowerCase()
  const ms = amount * (unit === "s" ? 1000 : unit === "m" ? MINUTE : HOUR)
  return { ok: true, ms }
}

type CronExpression = {
  minute: CronField
  hour: CronField
  dayOfMonth: CronField
  month: CronField
  dayOfWeek: CronField
}

function parseCron(value: string): CronParseResult {
  const fields = value.split(/\s+/)
  const normalized =
    fields.length === 5
      ? fields
      : fields.length === 6 && ["0", "*", "?"].includes(fields[0])
        ? fields.slice(1)
        : null

  if (!normalized) {
    return { ok: false, message: "cron 表达式需要 5 个字段" }
  }

  const minute = parseCronField(normalized[0], 0, 59)
  const hour = parseCronField(normalized[1], 0, 23)
  const dayOfMonth = parseCronField(normalized[2], 1, 31)
  const month = parseCronField(normalized[3], 1, 12)
  const dayOfWeek = parseCronField(normalized[4], 0, 7)

  if (!minute.ok) {
    return minute
  }
  if (!hour.ok) {
    return hour
  }
  if (!dayOfMonth.ok) {
    return dayOfMonth
  }
  if (!month.ok) {
    return month
  }
  if (!dayOfWeek.ok) {
    return dayOfWeek
  }

  return {
    ok: true,
    minute: minute.values,
    hour: hour.values,
    dayOfMonth: dayOfMonth.values,
    month: month.values,
    dayOfWeek: dayOfWeek.values,
  }
}

function parseCronField(
  value: string,
  min: number,
  max: number
): CronFieldParseResult {
  if (value === "*" || value === "?") {
    return { ok: true, values: null }
  }

  const values = new Set<number>()
  for (const rawPart of value.split(",")) {
    const part = rawPart.trim()
    if (!part) {
      return { ok: false, message: "cron 字段不能为空" }
    }

    const collected = collectCronPart(part, min, max)
    if (!collected.ok) {
      return collected
    }
    collected.values.forEach((item) => values.add(item))
  }

  if (values.size === 0) {
    return { ok: false, message: "cron 字段没有可执行值" }
  }

  return { ok: true, values }
}

function collectCronPart(
  part: string,
  min: number,
  max: number
): CronPartParseResult {
  const [rangePart, stepPart] = part.split("/")
  const step = stepPart == null ? 1 : Number(stepPart)
  if (!Number.isSafeInteger(step) || step <= 0) {
    return { ok: false, message: "cron 步长必须大于 0" }
  }

  let start: number
  let end: number
  if (rangePart === "*" || rangePart === "?") {
    start = min
    end = max
  } else if (rangePart.includes("-")) {
    const [rawStart, rawEnd] = rangePart.split("-")
    start = Number(rawStart)
    end = Number(rawEnd)
  } else {
    start = Number(rangePart)
    end = start
  }

  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < min ||
    end > max ||
    start > end
  ) {
    return { ok: false, message: "cron 字段超出允许范围" }
  }

  const values: number[] = []
  for (let value = start; value <= end; value += step) {
    values.push(value)
  }

  return { ok: true, values }
}

function matchesCron(cron: CronExpression, value: Date) {
  return (
    matchesField(cron.minute, value.getMinutes()) &&
    matchesField(cron.hour, value.getHours()) &&
    matchesField(cron.dayOfMonth, value.getDate()) &&
    matchesField(cron.month, value.getMonth() + 1) &&
    matchesField(cron.dayOfWeek, value.getDay())
  )
}

function matchesField(field: CronField, value: number) {
  return field == null || field.has(value) || (value === 0 && field.has(7))
}
