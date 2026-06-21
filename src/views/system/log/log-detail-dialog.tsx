"use client"

import { useEffect, useState } from "react"
import type * as React from "react"
import { CheckCircle2Icon, CopyIcon, EyeIcon, XCircleIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { useIsMobile } from "@/hooks/use-mobile"
import { formatAbsoluteDateTime } from "@/lib/datetime"
import type {
  LoginLogResource,
  LogStatusFlag,
  OperationLogResource,
} from "@/types/admin"

type DetailDialogProps<TData> = {
  open: boolean
  record: TData | null
  onOpenChange: (open: boolean) => void
}

type DetailField = { label: string; value: React.ReactNode }

const BUSINESS_TYPE_LABELS: Record<number, string> = {
  0: "其他",
  1: "新增",
  2: "修改",
  3: "删除",
  4: "授权",
}

const LOG_STATUS_LABELS = {
  "0": "成功",
  "1": "失败",
} as const

type IpLocationLookup = {
  address: string
  error: string | null
  isLoading: boolean
}

type IpWhoIsResponse = {
  success: boolean
  message?: string
  country?: string
  region?: string
  city?: string
  isp?: string
}

const IP_LOCATION_CACHE = new Map<string, string>()
const EMPTY_IP_LOOKUP: IpLocationLookup = {
  address: "",
  error: null,
  isLoading: false,
}

export function LogDetailButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" size="sm" onClick={onClick}>
      <EyeIcon data-icon="inline-start" />
      详情
    </Button>
  )
}

export function OperationLogDetailDialog({
  open,
  record,
  onOpenChange,
}: DetailDialogProps<OperationLogResource>) {
  const locationLookup = useIpLocationLookup(
    open,
    record?.oper_ip,
    record?.oper_location
  )

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-h-[88svh] gap-0 p-0 sm:max-w-5xl">
        <ResponsiveDialogHeader className="px-5 py-2 pr-12 text-left">
          <ResponsiveDialogTitle className="flex items-center gap-2">
            操作日志详情
            {record ? <LogStatusBadge status={record.status} /> : null}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="sr-only">
            查看本次后台操作的请求、参数和执行结果。
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ScrollArea className="max-h-[calc(88svh-4.5rem)] px-5 pb-5">
          {record ? (
            <div className="flex flex-col gap-3">
              <CompactDetailTable
                title="概要"
                fields={[
                  { label: "操作模块", value: record.title },
                  {
                    label: "业务类型",
                    value: (
                      <Badge variant="outline">
                        {businessTypeLabel(record.business_type)}
                      </Badge>
                    ),
                  },
                  {
                    label: "操作时间",
                    value: formatAbsoluteDateTime(record.operated_at),
                  },
                  { label: "消耗时间", value: `${record.cost_time} 毫秒` },
                  { label: "操作人员", value: record.oper_name || "系统" },
                  { label: "所属部门", value: record.dept_name },
                  {
                    label: "操作地址",
                    value: (
                      <AddressValue
                        ip={record.oper_ip}
                        storedLocation={record.oper_location}
                        lookup={locationLookup}
                      />
                    ),
                  },
                  {
                    label: "请求地址",
                    value: (
                      <RequestAddress
                        method={record.request_method}
                        url={record.oper_url}
                      />
                    ),
                  },
                  { label: "操作方法", value: record.method },
                ]}
              />
              <PayloadSection title="请求参数" value={record.oper_param} />
              <PayloadSection title="返回参数" value={record.json_result} />
              {record.error_msg ? (
                <PayloadSection title="异常信息" value={record.error_msg} />
              ) : null}
            </div>
          ) : null}
        </ScrollArea>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

export function LoginLogDetailDialog({
  open,
  record,
  onOpenChange,
}: DetailDialogProps<LoginLogResource>) {
  const locationLookup = useIpLocationLookup(
    open,
    record?.ip_addr,
    record?.login_location
  )

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-h-[88svh] gap-0 p-0 sm:max-w-3xl">
        <ResponsiveDialogHeader className="px-5 py-2 pr-12 text-left">
          <ResponsiveDialogTitle className="flex items-center gap-2">
            登录日志详情
            {record ? <LogStatusBadge status={record.status} /> : null}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="sr-only">
            查看本次登录的账号、客户端和执行状态。
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ScrollArea className="max-h-[calc(88svh-4.5rem)] px-5 pb-5">
          {record ? (
            <div className="flex flex-col gap-3">
              <CompactDetailTable
                title="概要"
                fields={[
                  { label: "登录账号", value: record.user_name },
                  {
                    label: "登录时间",
                    value: formatAbsoluteDateTime(record.login_at),
                  },
                  { label: "提示消息", value: record.msg },
                  {
                    label: "登录地址",
                    value: (
                      <AddressValue
                        ip={record.ip_addr}
                        storedLocation={record.login_location}
                        lookup={locationLookup}
                      />
                    ),
                  },
                  { label: "浏览器", value: record.browser },
                  { label: "操作系统", value: record.os },
                ]}
              />
            </div>
          ) : null}
        </ScrollArea>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

function CompactDetailTable({
  title,
  fields,
}: {
  title: string
  fields: DetailField[]
}) {
  const isMobile = useIsMobile()
  const rows = chunkFields(fields, isMobile ? 1 : 2)

  return (
    <section className="overflow-hidden rounded-md border">
      <div className="border-b bg-muted/30 px-3 py-2 text-sm font-semibold">
        {title}
      </div>
      <Table>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow
              key={`${title}-${index}`}
              className="hover:bg-transparent"
            >
              {row.flatMap((field) => [
                <TableCell
                  key={`${field.label}-label`}
                  className="w-24 bg-muted/20 px-3 py-2 text-muted-foreground"
                >
                  {field.label}
                </TableCell>,
                <TableCell
                  key={`${field.label}-value`}
                  className="min-w-0 px-3 py-2 font-medium break-words whitespace-normal"
                >
                  {displayValue(field.value)}
                </TableCell>,
              ])}
              {row.length === 1 ? (
                <>
                  <TableCell className="w-24 bg-muted/20 px-3 py-2" />
                  <TableCell className="px-3 py-2" />
                </>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  )
}

function PayloadSection({ title, value }: { title: string; value: string }) {
  const formattedValue = formatPayload(value)

  return (
    <section className="overflow-hidden rounded-md border">
      <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-3 py-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => copyText(formattedValue)}
        >
          <CopyIcon data-icon="inline-start" />
          复制
        </Button>
      </div>
      <pre className="max-h-44 overflow-auto bg-muted/40 px-3 py-2 font-mono text-xs leading-relaxed whitespace-pre-wrap">
        {formattedValue}
      </pre>
    </section>
  )
}

function RequestAddress({ method, url }: { method: string; url: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <Badge variant="secondary">{method}</Badge>
      <span className="min-w-0 break-all">{url || "-"}</span>
    </span>
  )
}

function chunkFields(fields: DetailField[], size: number) {
  const rows: DetailField[][] = []
  for (let index = 0; index < fields.length; index += size) {
    rows.push(fields.slice(index, index + size))
  }
  return rows
}

function LogStatusBadge({ status }: { status: LogStatusFlag }) {
  const isSuccess = status === "0"

  return (
    <Badge variant={isSuccess ? "secondary" : "destructive"}>
      {isSuccess ? (
        <CheckCircle2Icon data-icon="inline-start" />
      ) : (
        <XCircleIcon data-icon="inline-start" />
      )}
      {LOG_STATUS_LABELS[status]}
    </Badge>
  )
}

function businessTypeLabel(value: number) {
  return BUSINESS_TYPE_LABELS[value] ?? String(value)
}

function AddressValue({
  ip,
  storedLocation,
  lookup,
}: {
  ip: string
  storedLocation: string
  lookup: IpLocationLookup
}) {
  const normalizedIp = normalizeIp(ip)
  const location = storedLocation.trim() || lookup.address
  const hasValue = Boolean(
    normalizedIp || location || lookup.isLoading || lookup.error
  )

  if (!hasValue) {
    return "-"
  }

  return (
    <span className="inline-flex min-w-0 flex-wrap items-center gap-2">
      {normalizedIp ? <span>{normalizedIp}</span> : null}
      {location ? (
        <span className="text-muted-foreground">{location}</span>
      ) : null}
      {lookup.isLoading ? (
        <span className="text-muted-foreground">归属地查询中...</span>
      ) : null}
      {!location && lookup.error ? (
        <span className="text-muted-foreground">归属地查询失败</span>
      ) : null}
    </span>
  )
}

function useIpLocationLookup(
  open: boolean,
  ip: string | null | undefined,
  storedLocation: string | null | undefined
): IpLocationLookup {
  const normalizedIp = normalizeIp(ip)
  const fallbackLocation = storedLocation?.trim() ?? ""
  const [lookup, setLookup] = useState<IpLocationLookup>(EMPTY_IP_LOOKUP)

  useEffect(() => {
    if (!open || !normalizedIp || fallbackLocation) {
      setLookup(EMPTY_IP_LOOKUP)
      return
    }

    if (!isPublicIpCandidate(normalizedIp)) {
      setLookup(EMPTY_IP_LOOKUP)
      return
    }

    const cachedAddress = IP_LOCATION_CACHE.get(normalizedIp)
    if (cachedAddress) {
      setLookup({
        address: cachedAddress,
        error: null,
        isLoading: false,
      })
      return
    }

    const controller = new AbortController()
    setLookup({
      address: "",
      error: null,
      isLoading: true,
    })

    fetch(`https://ipwho.is/${encodeURIComponent(normalizedIp)}?lang=zh-CN`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`IP lookup failed with ${response.status}`)
        }
        return response.json() as Promise<IpWhoIsResponse>
      })
      .then((data) => {
        if (!data.success) {
          throw new Error(data.message || "IP lookup failed")
        }

        const address = formatIpLocation(data)
        if (address) {
          IP_LOCATION_CACHE.set(normalizedIp, address)
        }
        setLookup({
          address,
          error: address ? null : "empty address",
          isLoading: false,
        })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }
        setLookup({
          address: "",
          error: error instanceof Error ? error.message : "IP lookup failed",
          isLoading: false,
        })
      })

    return () => controller.abort()
  }, [fallbackLocation, normalizedIp, open])

  return lookup
}

function normalizeIp(ip: string | null | undefined) {
  return (ip ?? "")
    .trim()
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .replace(/^::ffff:/i, "")
}

function isPublicIpCandidate(ip: string) {
  const value = ip.toLowerCase()
  if (!value || value === "localhost" || value === "::" || value === "::1") {
    return false
  }

  if (value.includes(":")) {
    return !(
      value.startsWith("fc") ||
      value.startsWith("fd") ||
      value.startsWith("fe80:")
    )
  }

  const parts = value.split(".").map((part) => Number(part))
  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return false
  }

  const [first, second] = parts
  if (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    first >= 224 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  ) {
    return false
  }

  return true
}

function formatIpLocation(data: IpWhoIsResponse) {
  const values = [data.country, data.region, data.city, data.isp]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))

  return Array.from(new Set(values)).join(" ")
}

function formatPayload(value: string) {
  const text = value.trim()
  if (!text) {
    return "(无数据)"
  }

  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}

function displayValue(value: React.ReactNode) {
  return value == null || value === "" ? "-" : value
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    toast.success("已复制")
  } catch {
    toast.error("复制失败，请手动选择文本复制。")
  }
}
