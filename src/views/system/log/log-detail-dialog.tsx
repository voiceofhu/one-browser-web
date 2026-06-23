"use client"

import { useEffect, useState } from "react"
import type * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { CopyIcon, EyeIcon } from "lucide-react"
import { toast } from "sonner"

import { getIpLocation, getLoginLog, getOperationLog } from "@/api/system/log"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { useIsMobile } from "@/hooks/use-mobile"
import { formatAbsoluteDateTime } from "@/lib/datetime"
import { systemQueryKeys } from "@/lib/query-keys"
import type {
  LoginLogSummaryResource,
  LogStatusFlag,
  OperationLogSummaryResource,
} from "@/types/admin"
import { businessTypeLabel } from "@/views/system/log/constants"
import { LogStatusBadge } from "@/views/system/log/log-status-badge"

type DetailDialogProps<TData> = {
  open: boolean
  record: TData | null
  onOpenChange: (open: boolean) => void
}

type DetailField = { label: string; value: React.ReactNode }

type IpLocationLookup = {
  address: string
  error: string | null
  isLoading: boolean
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
}: DetailDialogProps<OperationLogSummaryResource>) {
  const detailQuery = useQuery({
    queryKey: [...systemQueryKeys.operationLogs, "detail", record?.oper_id],
    queryFn: () => getOperationLog(record!.oper_id),
    enabled: open && Boolean(record),
  })
  const detail = detailQuery.data
  const locationLookup = useIpLocationLookup(
    open,
    detail?.oper_ip,
    detail?.oper_location
  )

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="flex max-h-[90svh] flex-col gap-0 overflow-hidden p-0 data-[vaul-drawer-direction=bottom]:min-h-[32svh] sm:max-w-5xl">
        <LogDetailHeader
          title="操作日志详情"
          status={record?.status}
          description="查看本次后台操作的请求、参数和执行结果。"
        />
        <ResponsiveDialogBody className="max-h-[calc(90svh-3.75rem)] min-h-0 flex-none overflow-y-auto px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          {detailQuery.isPending ? (
            <DetailLoading />
          ) : detailQuery.isError ? (
            <DetailError />
          ) : detail ? (
            <div className="flex flex-col gap-3">
              <CompactDetailTable
                title="概要"
                fields={[
                  { label: "操作模块", value: detail.title },
                  {
                    label: "业务类型",
                    value: (
                      <Badge variant="outline">
                        {businessTypeLabel(detail.business_type)}
                      </Badge>
                    ),
                  },
                  {
                    label: "操作时间",
                    value: formatAbsoluteDateTime(detail.operated_at),
                  },
                  { label: "消耗时间", value: `${detail.cost_time} 毫秒` },
                  { label: "操作人员", value: detail.oper_name || "系统" },
                  { label: "所属部门", value: detail.dept_name },
                  {
                    label: "操作地址",
                    value: (
                      <AddressValue
                        ip={detail.oper_ip}
                        storedLocation={detail.oper_location}
                        lookup={locationLookup}
                      />
                    ),
                  },
                  {
                    label: "请求地址",
                    value: (
                      <RequestAddress
                        method={detail.request_method}
                        url={detail.oper_url}
                      />
                    ),
                  },
                  { label: "操作方法", value: detail.method },
                ]}
              />
              <PayloadSection title="请求参数" value={detail.oper_param} />
              <PayloadSection title="返回参数" value={detail.json_result} />
              {detail.error_msg ? (
                <PayloadSection title="异常信息" value={detail.error_msg} />
              ) : null}
            </div>
          ) : null}
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

export function LoginLogDetailDialog({
  open,
  record,
  onOpenChange,
}: DetailDialogProps<LoginLogSummaryResource>) {
  const detailQuery = useQuery({
    queryKey: [...systemQueryKeys.loginLogs, "detail", record?.info_id],
    queryFn: () => getLoginLog(record!.info_id),
    enabled: open && Boolean(record),
  })
  const detail = detailQuery.data
  const locationLookup = useIpLocationLookup(
    open,
    detail?.ip_addr,
    detail?.login_location
  )

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="flex max-h-[90svh] flex-col gap-0 overflow-hidden p-0 data-[vaul-drawer-direction=bottom]:min-h-[32svh] sm:max-w-3xl">
        <LogDetailHeader
          title="登录日志详情"
          status={record?.status}
          description="查看本次登录的账号、客户端和执行状态。"
        />
        <ResponsiveDialogBody className="max-h-[calc(90svh-3.75rem)] min-h-0 flex-none overflow-y-auto px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          {detailQuery.isPending ? (
            <DetailLoading />
          ) : detailQuery.isError ? (
            <DetailError />
          ) : detail ? (
            <div className="flex flex-col gap-3">
              <CompactDetailTable
                title="概要"
                fields={[
                  { label: "登录账号", value: detail.user_name },
                  {
                    label: "登录时间",
                    value: formatAbsoluteDateTime(detail.login_at),
                  },
                  { label: "提示消息", value: detail.msg },
                  {
                    label: "登录地址",
                    value: (
                      <AddressValue
                        ip={detail.ip_addr}
                        storedLocation={detail.login_location}
                        lookup={locationLookup}
                      />
                    ),
                  },
                  { label: "浏览器", value: detail.browser },
                  { label: "操作系统", value: detail.os },
                ]}
              />
            </div>
          ) : null}
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

function DetailLoading() {
  return (
    <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-muted-foreground">
      <Spinner />
      加载详情中...
    </div>
  )
}

function DetailError() {
  return (
    <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">
      详情加载失败，请关闭后重试。
    </div>
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

function LogDetailHeader({
  title,
  status,
  description,
}: {
  title: string
  status?: LogStatusFlag
  description: string
}) {
  return (
    <ResponsiveDialogHeader className="border-b px-5 pt-4 pr-12 pb-3 text-left sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <ResponsiveDialogTitle className="min-w-0 truncate text-base leading-tight font-semibold tracking-tight">
          {title}
        </ResponsiveDialogTitle>
        {status ? <LogStatusBadge status={status} /> : null}
      </div>
      <ResponsiveDialogDescription className="sr-only">
        {description}
      </ResponsiveDialogDescription>
    </ResponsiveDialogHeader>
  )
}

function chunkFields(fields: DetailField[], size: number) {
  const rows: DetailField[][] = []
  for (let index = 0; index < fields.length; index += size) {
    rows.push(fields.slice(index, index + size))
  }
  return rows
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
    let isActive = true
    const deferLookup = (nextLookup: IpLocationLookup) => {
      queueMicrotask(() => {
        if (isActive) {
          setLookup(nextLookup)
        }
      })
    }

    if (!open || !normalizedIp || fallbackLocation) {
      deferLookup(EMPTY_IP_LOOKUP)
      return () => {
        isActive = false
      }
    }

    if (!isPublicIpCandidate(normalizedIp)) {
      deferLookup(EMPTY_IP_LOOKUP)
      return () => {
        isActive = false
      }
    }

    const cachedAddress = IP_LOCATION_CACHE.get(normalizedIp)
    if (cachedAddress) {
      deferLookup({
        address: cachedAddress,
        error: null,
        isLoading: false,
      })
      return () => {
        isActive = false
      }
    }

    deferLookup({
      address: "",
      error: null,
      isLoading: true,
    })

    getIpLocation(normalizedIp)
      .then((data) => {
        const address = data.location.trim()
        if (address) {
          IP_LOCATION_CACHE.set(normalizedIp, address)
        }
        if (!isActive) {
          return
        }
        setLookup({
          address,
          error: address ? null : "empty address",
          isLoading: false,
        })
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return
        }
        setLookup({
          address: "",
          error: error instanceof Error ? error.message : "IP lookup failed",
          isLoading: false,
        })
      })

    return () => {
      isActive = false
    }
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
