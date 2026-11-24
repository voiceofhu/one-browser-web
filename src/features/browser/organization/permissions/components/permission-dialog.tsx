import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/responsive-dialog';
import { DialogActionButton } from '@/components/ui/dialog-action-button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import * as React from 'react';
import { toast } from '@/components/ui/toast';

import type {
  RemotePermissionPayload,
  RemotePermissionResource,
  RemotePermissionScope,
  RemotePermissionType,
  RemoteStatusFlag,
} from '../types';
import {
  collectDescendantIds,
  comparePermissions,
  parentTypeFor,
  permissionBreadcrumb,
  resolveInitialPermissionType,
} from './permission-dialog-utils';

type PermissionDialogMode = 'create' | 'edit';

const permissionTypes: Array<{
  value: RemotePermissionType;
  label: string;
}> = [
  { value: 'M', label: '目录' },
  { value: 'C', label: '菜单' },
  { value: 'F', label: '按钮' },
];

const permissionScopes: Array<{
  value: RemotePermissionScope;
  label: string;
}> = [
  { value: 'T', label: '团队权限' },
  { value: 'G', label: '全局权限' },
];

export function PermissionDialog({
  mode,
  record,
  parent,
  permissions,
  isSaving,
  onOpenChange,
  onSubmit,
}: {
  mode: PermissionDialogMode;
  record?: RemotePermissionResource | null;
  parent?: RemotePermissionResource | null;
  permissions: RemotePermissionResource[];
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: RemotePermissionPayload) => void;
}) {
  const isEdit = mode === 'edit' && Boolean(record);
  const initialType = resolveInitialPermissionType(record, parent);
  const [permissionName, setPermissionName] = React.useState(
    record?.permission_name ?? '',
  );
  const [permissionType, setPermissionType] =
    React.useState<RemotePermissionType>(initialType);
  const [permissionScope, setPermissionScope] =
    React.useState<RemotePermissionScope>(
      record?.permission_scope ?? parent?.permission_scope ?? 'T',
    );
  const [parentId, setParentId] = React.useState<number | null>(
    record?.parent_id ?? parent?.permission_id ?? null,
  );
  const [path, setPath] = React.useState(
    initialType === 'F' ? '' : (record?.path ?? ''),
  );
  const [permissionCode, setPermissionCode] = React.useState(
    initialType === 'M' ? '' : (record?.permission_code ?? ''),
  );
  const [icon, setIcon] = React.useState(
    initialType === 'F' ? '#' : (record?.icon ?? '#'),
  );
  const [visible, setVisible] = React.useState<RemoteStatusFlag>(
    initialType === 'F' ? '1' : (record?.visible ?? '0'),
  );
  const [remark, setRemark] = React.useState(record?.remark ?? '');
  const descendantIds = React.useMemo(
    () =>
      record
        ? collectDescendantIds(permissions, record.permission_id)
        : new Set<number>(),
    [permissions, record],
  );
  const parentOptions = React.useMemo(
    () =>
      permissions
        .filter(
          (candidate) =>
            candidate.permission_type === parentTypeFor(permissionType) &&
            candidate.permission_id !== record?.permission_id &&
            !descendantIds.has(candidate.permission_id),
        )
        .sort(comparePermissions),
    [descendantIds, permissionType, permissions, record?.permission_id],
  );

  function changePermissionType(nextType: RemotePermissionType) {
    const previousType = permissionType;
    setPermissionType(nextType);
    const currentParent = permissions.find(
      (candidate) => candidate.permission_id === parentId,
    );
    if (currentParent?.permission_type !== parentTypeFor(nextType)) {
      setParentId(null);
    }
    if (nextType === 'M') {
      setPermissionCode('');
    }
    if (nextType === 'F') {
      setPath('');
      setIcon('#');
      setVisible('1');
    } else if (previousType === 'F') {
      setVisible('0');
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) {
      return;
    }

    const name = permissionName.trim();
    const normalizedPath = permissionType === 'F' ? '' : path.trim();
    const normalizedCode =
      permissionType === 'M' ? null : permissionCode.trim();
    if (!name) {
      toast.error('权限名称不能为空');
      return;
    }
    if (permissionType === 'C' && !normalizedPath) {
      toast.error('菜单必须填写路由地址');
      return;
    }
    if (!normalizedCode && permissionType !== 'M') {
      toast.error('菜单和按钮必须填写权限标识');
      return;
    }
    if (
      normalizedCode &&
      !/^browser:[a-z0-9][a-z0-9:_-]*$/.test(normalizedCode)
    ) {
      toast.error('权限标识需以 browser: 开头，并使用小写字母、数字或 : _ -');
      return;
    }
    if (permissionType !== 'M' && !parentId) {
      toast.error(`${permissionType === 'C' ? '菜单' : '按钮'}必须选择父级`);
      return;
    }

    onSubmit({
      permission_name: name,
      parent_id: parentId,
      path: normalizedPath,
      permission_type: permissionType,
      permission_scope: permissionScope,
      visible: permissionType === 'F' ? '1' : visible,
      status: record?.status ?? '0',
      permission_code: normalizedCode,
      icon: permissionType === 'F' ? '#' : icon.trim() || '#',
      remark: remark.trim(),
    });
  }

  return (
    <ResponsiveDialog open onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-xl">
        <form
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          onSubmit={submit}
        >
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {isEdit ? '编辑权限' : parent ? '新增子权限' : '新增权限'}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              配置 App 菜单、页面与操作按钮的权限标识
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <ResponsiveDialogBody>
            <FieldGroup className="gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <RequiredFieldLabel htmlFor="permission-name">
                    权限名称
                  </RequiredFieldLabel>
                  <Input
                    id="permission-name"
                    value={permissionName}
                    maxLength={64}
                    disabled={isSaving}
                    autoFocus
                    onChange={(event) => setPermissionName(event.target.value)}
                  />
                </Field>
                <Field>
                  <RequiredFieldLabel>权限类型</RequiredFieldLabel>
                  <Select
                    value={permissionType}
                    disabled={isSaving || isEdit}
                    onValueChange={(value) =>
                      changePermissionType(value as RemotePermissionType)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {permissionTypes.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel>
                    {permissionType === 'M' ? '上级目录' : '父级权限'}
                    {permissionType === 'M' ? null : (
                      <span className="text-destructive">*</span>
                    )}
                  </FieldLabel>
                  <Select
                    value={parentId ? String(parentId) : 'none'}
                    disabled={isSaving || isEdit}
                    onValueChange={(value) =>
                      setParentId(value === 'none' ? null : Number(value))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        value="none"
                        disabled={permissionType !== 'M'}
                      >
                        {permissionType === 'M' ? '顶级目录' : '请选择父级'}
                      </SelectItem>
                      {parentOptions.map((option) => (
                        <SelectItem
                          key={option.permission_id}
                          value={String(option.permission_id)}
                        >
                          {permissionBreadcrumb(option, permissions)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <RequiredFieldLabel>权限范围</RequiredFieldLabel>
                  <Select
                    value={permissionScope}
                    disabled={isSaving || isEdit}
                    onValueChange={(value) =>
                      setPermissionScope(value as RemotePermissionScope)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {permissionScopes.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              {permissionType === 'F' ? null : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field>
                    {permissionType === 'C' ? (
                      <RequiredFieldLabel htmlFor="permission-path">
                        路由地址
                      </RequiredFieldLabel>
                    ) : (
                      <FieldLabel htmlFor="permission-path">
                        路由地址
                      </FieldLabel>
                    )}
                    <Input
                      id="permission-path"
                      value={path}
                      maxLength={255}
                      disabled={isSaving || isEdit}
                      placeholder="/browser/example"
                      onChange={(event) => setPath(event.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="permission-icon">图标</FieldLabel>
                    <Input
                      id="permission-icon"
                      value={icon}
                      maxLength={100}
                      disabled={isSaving}
                      placeholder="#"
                      onChange={(event) => setIcon(event.target.value)}
                    />
                  </Field>
                </div>
              )}

              {permissionType === 'M' ? null : (
                <Field>
                  <RequiredFieldLabel htmlFor="permission-code">
                    权限标识
                  </RequiredFieldLabel>
                  <Input
                    id="permission-code"
                    value={permissionCode}
                    maxLength={128}
                    disabled={isSaving || isEdit}
                    className="font-mono"
                    placeholder="browser:resource:action"
                    onChange={(event) => setPermissionCode(event.target.value)}
                  />
                </Field>
              )}

              {permissionType === 'F' ? null : (
                <Field
                  orientation="horizontal"
                  className="border-border/70 bg-muted/20 rounded-lg border px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <FieldLabel htmlFor="permission-visible">
                      在导航中显示
                    </FieldLabel>
                    <p className="text-muted-foreground mt-0.5 text-[0.6875rem]">
                      关闭后仍保留路由权限，但不展示菜单入口。
                    </p>
                  </div>
                  <Switch
                    id="permission-visible"
                    size="sm"
                    checked={visible === '0'}
                    disabled={isSaving}
                    onCheckedChange={(checked) =>
                      setVisible(checked ? '0' : '1')
                    }
                  />
                </Field>
              )}

              <Field>
                <FieldLabel htmlFor="permission-remark">备注</FieldLabel>
                <Textarea
                  id="permission-remark"
                  value={remark}
                  className="min-h-16 resize-none"
                  maxLength={500}
                  disabled={isSaving}
                  onChange={(event) => setRemark(event.target.value)}
                />
              </Field>
            </FieldGroup>
          </ResponsiveDialogBody>

          <ResponsiveDialogFooter>
            <DialogActionButton
              action="cancel"
              type="button"
              disabled={isSaving}
              onClick={() => onOpenChange(false)}
            >
              取消
            </DialogActionButton>
            <DialogActionButton
              type="submit"
              loading={isSaving}
              loadingText="保存中..."
            >
              保存
            </DialogActionButton>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function RequiredFieldLabel({
  children,
  ...props
}: React.ComponentProps<typeof FieldLabel>) {
  return (
    <FieldLabel {...props}>
      {children}
      <span className="text-destructive">*</span>
    </FieldLabel>
  );
}
