import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/responsive-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DialogActionButton } from '@/components/ui/dialog-action-button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import * as React from 'react';
import { toast } from '@/components/ui/toast';

import type {
  RemoteMemberPermissionOptionResource,
  RemoteTeamRolePayload,
  RemoteTeamRoleResource,
} from '../types';
import {
  PermissionTreeItem,
  PermissionTreeLoading,
  type PermissionTreeNode,
  TreeControl,
  buildNodeMap,
  buildParentMap,
  buildPermissionTree,
  collectNodePermissionCodes,
  getAncestorIds,
  normalizeLinkedSelection,
  removeEmptyAncestorPermissions,
} from './role-permission-tree';

export function RoleDialog({
  mode,
  record,
  teamId,
  teamName,
  permissionOptions,
  isLoadingPermissions,
  hasPermissionError,
  onRetryPermissions,
  isSaving,
  onOpenChange,
  onSubmit,
}: {
  mode: 'create' | 'edit';
  record?: RemoteTeamRoleResource | null;
  teamId: number;
  teamName: string;
  permissionOptions: RemoteMemberPermissionOptionResource[];
  isLoadingPermissions: boolean;
  hasPermissionError: boolean;
  onRetryPermissions: () => void;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: RemoteTeamRolePayload) => void;
}) {
  const isEdit = mode === 'edit' && Boolean(record);
  const initiallyGrantedPermissions = React.useMemo(
    () => new Set([...(record?.menus ?? []), ...(record?.permissions ?? [])]),
    [record],
  );
  const [selectedPermissions, setSelectedPermissions] = React.useState(
    () => new Set(initiallyGrantedPermissions),
  );
  const [expandedIds, setExpandedIds] = React.useState<Set<number>>(new Set());
  const [linked, setLinked] = React.useState(true);
  const initializedExpansionKeyRef = React.useRef<string | null>(null);
  const tree = React.useMemo(
    () => buildPermissionTree(permissionOptions),
    [permissionOptions],
  );
  const nodeById = React.useMemo(() => buildNodeMap(tree), [tree]);
  const parentById = React.useMemo(
    () => buildParentMap(permissionOptions),
    [permissionOptions],
  );
  const expandableIds = React.useMemo(
    () =>
      Array.from(nodeById.values())
        .filter((node) => node.children.length > 0)
        .map((node) => node.option.menu_id),
    [nodeById],
  );
  const allPermissionCodes = React.useMemo(
    () =>
      permissionOptions.flatMap((option) =>
        option.permission_code &&
        option.assignable !== false &&
        (option.status === '0' ||
          initiallyGrantedPermissions.has(option.permission_code))
          ? [option.permission_code]
          : [],
      ),
    [initiallyGrantedPermissions, permissionOptions],
  );
  const selectablePermissionCodes = React.useMemo(
    () => new Set(allPermissionCodes),
    [allPermissionCodes],
  );
  const optionByPermission = React.useMemo(
    () =>
      new Map(
        permissionOptions.flatMap((option) =>
          option.permission_code
            ? [[option.permission_code, option] as const]
            : [],
        ),
      ),
    [permissionOptions],
  );

  React.useEffect(() => {
    const expansionKey = expandableIds.join(',');
    if (!expansionKey || initializedExpansionKeyRef.current === expansionKey) {
      return;
    }
    initializedExpansionKeyRef.current = expansionKey;
    setExpandedIds(new Set(expandableIds));
  }, [expandableIds]);

  const selectedMenuCount = permissionOptions.filter(
    (option) =>
      option.menu_type !== 'F' &&
      option.permission_code &&
      selectedPermissions.has(option.permission_code),
  ).length;
  const selectedButtonCount = permissionOptions.filter(
    (option) =>
      option.menu_type === 'F' &&
      option.permission_code &&
      selectedPermissions.has(option.permission_code),
  ).length;
  const allSelected =
    allPermissionCodes.length > 0 &&
    allPermissionCodes.every((permission) =>
      selectedPermissions.has(permission),
    );
  const someSelected = allPermissionCodes.some((permission) =>
    selectedPermissions.has(permission),
  );
  const allExpanded =
    expandableIds.length > 0 &&
    expandableIds.every((menuId) => expandedIds.has(menuId));

  function toggleExpandAll(checked: boolean) {
    setExpandedIds(checked ? new Set(expandableIds) : new Set());
  }

  function toggleExpanded(menuId: number) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(menuId)) {
        next.delete(menuId);
      } else {
        next.add(menuId);
      }
      return next;
    });
  }

  function toggleAllPermissions(checked: boolean) {
    setSelectedPermissions(checked ? new Set(allPermissionCodes) : new Set());
  }

  function toggleLinked(checked: boolean) {
    setLinked(checked);
    if (!checked) {
      return;
    }

    setSelectedPermissions((current) =>
      normalizeLinkedSelection(
        current,
        tree,
        parentById,
        nodeById,
        selectablePermissionCodes,
      ),
    );
  }

  function toggleNode(node: PermissionTreeNode, checked: boolean) {
    setSelectedPermissions((current) => {
      const next = new Set(current);
      if (!linked) {
        const permission = node.option.permission_code;
        if (!permission) {
          return next;
        }
        if (checked) {
          next.add(permission);
        } else {
          next.delete(permission);
        }
        return next;
      }

      const nodeCodes = collectNodePermissionCodes(node).filter((permission) =>
        selectablePermissionCodes.has(permission),
      );
      if (checked) {
        nodeCodes.forEach((permission) => next.add(permission));
        getAncestorIds(node.option.menu_id, parentById).forEach((menuId) => {
          const permission = nodeById.get(menuId)?.option.permission_code;
          if (permission && selectablePermissionCodes.has(permission)) {
            next.add(permission);
          }
        });
      } else {
        nodeCodes.forEach((permission) => next.delete(permission));
        removeEmptyAncestorPermissions(
          next,
          node.option.menu_id,
          parentById,
          nodeById,
        );
      }
      return next;
    });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving || isLoadingPermissions || hasPermissionError) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const roleName = textValue(formData, 'role_name');
    const roleKey = textValue(formData, 'role_key');
    if (!roleName || !roleKey) {
      toast.error('角色名称和权限标识必填');
      return;
    }

    const menus: string[] = [];
    const permissions: string[] = [];
    selectedPermissions.forEach((permission) => {
      const option = optionByPermission.get(permission);
      if (option?.menu_type === 'F') {
        permissions.push(permission);
      } else if (option) {
        menus.push(permission);
      } else if (record?.permissions.includes(permission)) {
        permissions.push(permission);
      } else if (record?.menus.includes(permission)) {
        menus.push(permission);
      }
    });

    onSubmit({
      team_id: teamId,
      role_name: roleName,
      role_key: roleKey,
      ...(isEdit && record ? { role_sort: record.role_sort } : {}),
      status: isEdit ? record?.status : '0',
      remark: textValue(formData, 'remark'),
      menus: menus.sort(),
      permissions: permissions.sort(),
    });
  }

  const permissionControlsDisabled =
    isSaving || isLoadingPermissions || hasPermissionError;

  return (
    <ResponsiveDialog open onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-2xl">
        <form
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          onSubmit={submit}
        >
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {isEdit ? '编辑角色' : '新增角色'}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {teamName} · 浏览器权限
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <ResponsiveDialogBody className="flex flex-col gap-3">
            <FieldGroup className="shrink-0 gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <RequiredFieldLabel htmlFor="role-name">
                    角色名称
                  </RequiredFieldLabel>
                  <Input
                    id="role-name"
                    name="role_name"
                    defaultValue={record?.role_name}
                    disabled={isSaving}
                    maxLength={64}
                    required
                  />
                </Field>
                <Field>
                  <RequiredFieldLabel htmlFor="role-key">
                    权限标识
                  </RequiredFieldLabel>
                  <Input
                    id="role-key"
                    name="role_key"
                    defaultValue={record?.role_key}
                    disabled={isSaving}
                    maxLength={100}
                    required
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="role-remark">备注</FieldLabel>
                <Textarea
                  id="role-remark"
                  name="remark"
                  className="min-h-16 resize-none"
                  defaultValue={record?.remark ?? ''}
                  disabled={isSaving}
                  maxLength={500}
                />
              </Field>
            </FieldGroup>

            <section className="border-border/70 bg-background shrink-0 overflow-hidden rounded-lg border">
              <div className="border-border/70 bg-muted/25 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b px-2.5 py-1.5 text-[0.6875rem]">
                <TreeControl
                  label="展开/折叠"
                  checked={allExpanded}
                  disabled={
                    permissionControlsDisabled || expandableIds.length === 0
                  }
                  onCheckedChange={toggleExpandAll}
                />
                <TreeControl
                  label="全选/全不选"
                  checked={
                    allSelected ? true : someSelected ? 'indeterminate' : false
                  }
                  disabled={
                    permissionControlsDisabled ||
                    allPermissionCodes.length === 0
                  }
                  onCheckedChange={toggleAllPermissions}
                />
                <TreeControl
                  label="父子联动"
                  checked={linked}
                  disabled={permissionControlsDisabled}
                  onCheckedChange={toggleLinked}
                />
                <div className="ml-auto flex items-center gap-1">
                  <Badge variant="outline" className="h-4 px-1.5">
                    菜单 {selectedMenuCount}
                  </Badge>
                  <Badge variant="outline" className="h-4 px-1.5">
                    按钮 {selectedButtonCount}
                  </Badge>
                </div>
              </div>

              <ScrollArea className="h-[min(19rem,42vh)]">
                <div className="p-1.5">
                  {isLoadingPermissions ? (
                    <PermissionTreeLoading />
                  ) : hasPermissionError ? (
                    <div className="text-destructive flex flex-col items-center gap-3 px-3 py-10 text-center text-xs">
                      <span>权限加载失败</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onRetryPermissions}
                      >
                        重新加载
                      </Button>
                    </div>
                  ) : tree.length ? (
                    tree.map((node) => (
                      <PermissionTreeItem
                        key={node.option.menu_id}
                        node={node}
                        depth={0}
                        selectedPermissions={selectedPermissions}
                        expandedIds={expandedIds}
                        disabled={isSaving}
                        linked={linked}
                        selectablePermissionCodes={selectablePermissionCodes}
                        onToggleNode={toggleNode}
                        onToggleExpanded={toggleExpanded}
                      />
                    ))
                  ) : (
                    <div className="text-muted-foreground px-3 py-10 text-center text-xs">
                      暂无权限，请先在权限资源中添加浏览器菜单与按钮。
                    </div>
                  )}
                </div>
              </ScrollArea>
            </section>
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
              disabled={isSaving || isLoadingPermissions || hasPermissionError}
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
      <span className="text-destructive" aria-hidden="true">
        *
      </span>
      <span className="sr-only">必填</span>
    </FieldLabel>
  );
}

function textValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}
