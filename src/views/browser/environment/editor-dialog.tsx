"use client"

import * as React from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DialogActionButton } from "@/components/ui/dialog-action-button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type {
  BrowserEnvironmentPayload,
  BrowserEnvironmentResource,
  BrowserTeamResource,
  BrowserVersionResource,
} from "@/types/browser"

type EnvironmentEditorDialogProps = {
  record: BrowserEnvironmentResource | null
  teams: BrowserTeamResource[]
  versions: BrowserVersionResource[]
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: BrowserEnvironmentPayload) => void
}

const modeOptions = [
  { value: "standard", label: "标准模式" },
  { value: "compat", label: "兼容模式" },
  { value: "strict", label: "严格模式" },
  { value: "dev", label: "开发模式" },
] as const

export function EnvironmentEditorDialog({
  record,
  teams,
  versions,
  isSaving,
  onOpenChange,
  onSubmit,
}: EnvironmentEditorDialogProps) {
  const currentVersion =
    versions.find((item) => item.is_current)?.version ??
    versions[0]?.version ??
    ""
  const [teamId, setTeamId] = React.useState(
    record?.team_id ? String(record.team_id) : String(teams[0]?.team_id ?? "")
  )
  const [name, setName] = React.useState(record?.name ?? "")
  const [environmentKey, setEnvironmentKey] = React.useState(
    record?.environment_key ?? ""
  )
  const [groupKey, setGroupKey] = React.useState(record?.group_key ?? "")
  const [chromiumVersion, setChromiumVersion] = React.useState(
    record?.chromium_version ?? currentVersion
  )
  const [mode, setMode] = React.useState(record?.mode ?? "standard")
  const [remark, setRemark] = React.useState(record?.remark ?? "")
  const selectedTeamId = teamId || String(teams[0]?.team_id ?? "")
  const selectedChromiumVersion = chromiumVersion || currentVersion

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedTeamId = Number(selectedTeamId)
    if (!parsedTeamId || !name.trim() || !environmentKey.trim()) {
      return
    }

    onSubmit({
      team_id: parsedTeamId,
      environment_key: environmentKey.trim(),
      environment_no: record?.environment_no ?? null,
      name: name.trim(),
      group_key: groupKey.trim() || null,
      chromium_version: selectedChromiumVersion || null,
      mode,
      status: record?.status ?? "0",
      proxy_id: record?.proxy_id ?? null,
      owner_member_id: record?.owner_member_id ?? null,
      remark: remark.trim(),
      fingerprint_config: record?.fingerprint_config ?? undefined,
      advanced: record?.advanced ?? undefined,
    })
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{record ? "编辑环境" : "新增环境"}</DialogTitle>
            <DialogDescription>
              为环境选择固定 Chromium 版本；启动时客户端会自动准备对应版本。
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel>所属团队</FieldLabel>
                <Select
                  value={selectedTeamId}
                  onValueChange={setTeamId}
                  disabled={isSaving || teams.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择团队" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {teams.map((team) => (
                        <SelectItem
                          key={team.team_id}
                          value={String(team.team_id)}
                        >
                          {team.team_name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Chromium 版本</FieldLabel>
                <Select
                  value={selectedChromiumVersion}
                  onValueChange={setChromiumVersion}
                  disabled={isSaving || versions.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择版本" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {record?.chromium_version &&
                      !versions.some(
                        (item) => item.version === record.chromium_version
                      ) ? (
                        <SelectItem value={record.chromium_version}>
                          {record.chromium_version}（当前环境）
                        </SelectItem>
                      ) : null}
                      {versions.map((item) => (
                        <SelectItem key={item.version} value={item.version}>
                          {item.version}
                          {item.is_current ? "（最新）" : ""}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="environment-name">环境名称</FieldLabel>
                <Input
                  id="environment-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={isSaving}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="environment-key">环境标识</FieldLabel>
                <Input
                  id="environment-key"
                  value={environmentKey}
                  onChange={(event) => setEnvironmentKey(event.target.value)}
                  disabled={isSaving}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="environment-group">分组</FieldLabel>
                <Input
                  id="environment-group"
                  value={groupKey}
                  onChange={(event) => setGroupKey(event.target.value)}
                  disabled={isSaving}
                  placeholder="可选"
                />
              </Field>

              <Field>
                <FieldLabel>运行模式</FieldLabel>
                <Select
                  value={mode}
                  onValueChange={setMode}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {modeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="environment-remark">备注</FieldLabel>
              <Textarea
                id="environment-remark"
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                disabled={isSaving}
                className="min-h-20 resize-none"
                placeholder="可选"
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogActionButton
              type="button"
              action="cancel"
              disabled={isSaving}
              onClick={() => onOpenChange(false)}
            >
              取消
            </DialogActionButton>
            <DialogActionButton
              type="submit"
              disabled={
                isSaving ||
                !selectedTeamId ||
                !name.trim() ||
                !environmentKey.trim() ||
                !selectedChromiumVersion
              }
              loading={isSaving}
              loadingText="保存中"
            >
              保存
            </DialogActionButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
