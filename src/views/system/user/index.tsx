import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DialogActionButton } from '@/components/ui/dialog-action-button';
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/responsive-dialog';
import { SystemResourceTable } from '@/components/system-resource-table';
import type { SystemRecord } from '@/components/system-resource-table/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/features/auth/auth-gate';
import { hasButtonPermission } from '@/features/auth/permissions';
import { toBrowserErrorMessage } from '@/features/browser/errors';
import { formatDateTimeTitle, formatDisplayDateTime } from '@/lib/date-time';
import { http } from '@/lib/http';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Edit02Icon,
  MoreHorizontalIcon,
  UserShield01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import * as React from 'react';
import { toast } from 'sonner';

type StatusFlag = '0' | '1';

type UserResource = {
  user_id: number;
  user_name: string;
  nick_name: string;
  user_type: string;
  email: string;
  phone_number: string;
  sex: string;
  avatar: string;
  status: StatusFlag;
  remark: string | null;
  is_super_admin: boolean;
};

type RoleResource = {
  role_id: number;
  role_name: string;
  role_key: string;
};

type PageResponse<T> = { list: T[]; total: number };

const USERS_QUERY_KEY = ['system-resource', '/system/users'] as const;

export default function UserPage() {
  const { access, user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const canUpdate = hasButtonPermission(access, 'system:user:update');
  const canAssignRole = hasButtonPermission(access, 'system:user:assign-role');
  const canUpdateStatus = hasButtonPermission(access, 'system:user:status');
  const [editingUser, setEditingUser] = React.useState<UserResource | null>(
    null,
  );
  const [roleUser, setRoleUser] = React.useState<UserResource | null>(null);
  const [disableUser, setDisableUser] = React.useState<UserResource | null>(
    null,
  );

  const statusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: number; status: StatusFlag }) =>
      updateUserStatus(userId, status),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      toast.success(variables.status === '0' ? '用户已启用' : '用户已停用');
      setDisableUser(null);
    },
    onError: (error) => toast.error(toBrowserErrorMessage(error)),
  });

  const renderCell = React.useCallback(
    (field: string, value: unknown, record: SystemRecord) => {
      if (field === 'user_name') {
        const user = record as UserResource;
        return (
          <div className="flex min-w-52 items-center gap-3">
            <Avatar className="size-9 shrink-0">
              <AvatarImage
                src={user.avatar || undefined}
                alt={user.nick_name || user.user_name}
              />
              <AvatarFallback className="bg-primary/10 text-primary">
                {(user.nick_name || user.user_name).slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">
                  {user.nick_name || user.user_name}
                </span>
                {user.user_id === currentUser.user_id && (
                  <Badge variant="secondary">当前身份</Badge>
                )}
              </div>
              <p className="text-muted-foreground truncate text-xs">
                @{user.user_name}
              </p>
            </div>
          </div>
        );
      }
      if (field === 'created_at') {
        const dateTime = typeof value === 'string' ? value : null;
        return (
          <span
            className="text-muted-foreground"
            title={formatDateTimeTitle(dateTime)}
          >
            {formatDisplayDateTime(dateTime)}
          </span>
        );
      }
      if (field !== 'status') return undefined;
      const user = record as UserResource;
      return (
        <Switch
          size="sm"
          checked={user.status === '0'}
          disabled={
            !canUpdateStatus || user.is_super_admin || statusMutation.isPending
          }
          aria-label={`${user.user_name}用户状态`}
          onCheckedChange={(checked) => {
            if (checked) {
              statusMutation.mutate({ userId: user.user_id, status: '0' });
            } else {
              setDisableUser(user);
            }
          }}
        />
      );
    },
    [canUpdateStatus, statusMutation, currentUser.user_id],
  );

  const renderRowActions = React.useCallback(
    (record: SystemRecord) => {
      const user = record as UserResource;
      return (
        <UserActions
          user={user}
          canUpdate={canUpdate && !user.is_super_admin}
          canAssignRole={
            canAssignRole &&
            !user.is_super_admin &&
            user.user_id !== currentUser.user_id
          }
          onEdit={() => setEditingUser(user)}
          onAssignRole={() => setRoleUser(user)}
        />
      );
    },
    [canAssignRole, canUpdate, currentUser.user_id],
  );

  return (
    <>
      <SystemResourceTable
        config={{
          title: '用户管理',
          description: '查看 One Browser 用户、账号状态和系统角色。',
          endpoint: '/system/users',
          serverPagination: true,
          columns: ['user_name', 'email', 'status', 'created_at'],
        }}
        renderCell={renderCell}
        renderRowActions={
          canUpdate || canAssignRole ? renderRowActions : undefined
        }
      />

      {editingUser ? (
        <UserProfileDialog
          user={editingUser}
          onClose={() => setEditingUser(null)}
        />
      ) : null}
      {roleUser ? (
        <UserRoleDialog user={roleUser} onClose={() => setRoleUser(null)} />
      ) : null}
      <DisableUserDialog
        user={disableUser}
        isPending={statusMutation.isPending}
        onClose={() => setDisableUser(null)}
        onConfirm={() => {
          if (disableUser) {
            statusMutation.mutate({
              userId: disableUser.user_id,
              status: '1',
            });
          }
        }}
      />
    </>
  );
}

function UserActions({
  user,
  canUpdate,
  canAssignRole,
  onEdit,
  onAssignRole,
}: {
  user: UserResource;
  canUpdate: boolean;
  canAssignRole: boolean;
  onEdit: () => void;
  onAssignRole: () => void;
}) {
  if (!canUpdate && !canAssignRole) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`${user.user_name}操作`}
        >
          <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuGroup>
          {canUpdate ? (
            <DropdownMenuItem onSelect={onEdit}>
              <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
              修改资料
            </DropdownMenuItem>
          ) : null}
          {canAssignRole ? (
            <DropdownMenuItem onSelect={onAssignRole}>
              <HugeiconsIcon icon={UserShield01Icon} strokeWidth={2} />
              修改角色
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserProfileDialog({
  user,
  onClose,
}: {
  user: UserResource;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [values, setValues] = React.useState(() => ({
    nick_name: user.nick_name,
    email: user.email,
    phone_number: user.phone_number,
    sex: user.sex,
    remark: user.remark ?? '',
  }));
  const mutation = useMutation({
    mutationFn: () => updateUser(user, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      toast.success('用户资料已更新');
      onClose();
    },
    onError: (error) => toast.error(toBrowserErrorMessage(error)),
  });

  return (
    <ResponsiveDialog open onOpenChange={(open) => !open && onClose()}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>修改用户资料</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            编辑 {user.user_name} 的基础资料。
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="grid gap-3 sm:grid-cols-2">
          <UserField label="昵称">
            <Input
              value={values.nick_name}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  nick_name: event.target.value,
                }))
              }
            />
          </UserField>
          <UserField label="邮箱">
            <Input
              type="email"
              value={values.email}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />
          </UserField>
          <UserField label="手机号">
            <Input
              value={values.phone_number}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  phone_number: event.target.value,
                }))
              }
            />
          </UserField>
          <UserField label="性别">
            <Select
              value={values.sex}
              onValueChange={(sex) =>
                setValues((current) => ({ ...current, sex }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">男</SelectItem>
                <SelectItem value="1">女</SelectItem>
                <SelectItem value="2">未设置</SelectItem>
              </SelectContent>
            </Select>
          </UserField>
          <UserField label="备注" className="sm:col-span-2">
            <Textarea
              value={values.remark}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  remark: event.target.value,
                }))
              }
            />
          </UserField>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <DialogActionButton
            action="cancel"
            variant="outline"
            disabled={mutation.isPending}
            onClick={onClose}
          >
            取消
          </DialogActionButton>
          <DialogActionButton
            action="confirm"
            disabled={mutation.isPending || !values.nick_name.trim()}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? '保存中…' : '保存'}
          </DialogActionButton>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function UserRoleDialog({
  user,
  onClose,
}: {
  user: UserResource;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const rolesQuery = useQuery({
    queryKey: ['system', 'roles', 'assignable'],
    queryFn: listAssignableRoles,
  });
  const bindingQuery = useQuery({
    queryKey: ['system', 'users', user.user_id, 'roles'],
    queryFn: () => getUserRole(user.user_id),
  });
  const [roleId, setRoleId] = React.useState<string | null>(null);
  const currentRoleId = bindingQuery.data?.role_id;
  const selectedRoleId =
    roleId ??
    (rolesQuery.data?.some((role) => role.role_id === currentRoleId)
      ? String(currentRoleId)
      : '');
  const mutation = useMutation({
    mutationFn: () => setUserRole(user.user_id, Number(selectedRoleId)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      toast.success('用户角色已更新');
      onClose();
    },
    onError: (error) => toast.error(toBrowserErrorMessage(error)),
  });

  return (
    <ResponsiveDialog open onOpenChange={(open) => !open && onClose()}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>修改用户角色</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            为 {user.user_name} 选择一个系统角色。
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <UserField label="系统角色">
            <Select
              value={selectedRoleId}
              disabled={rolesQuery.isLoading || bindingQuery.isLoading}
              onValueChange={setRoleId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择角色" />
              </SelectTrigger>
              <SelectContent>
                {(rolesQuery.data ?? []).map((role) => (
                  <SelectItem key={role.role_id} value={String(role.role_id)}>
                    {role.role_name} ({role.role_key})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {rolesQuery.isError || bindingQuery.isError ? (
              <p className="text-destructive mt-1.5 text-xs">
                {toBrowserErrorMessage(rolesQuery.error ?? bindingQuery.error)}
              </p>
            ) : null}
          </UserField>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <DialogActionButton
            action="cancel"
            variant="outline"
            disabled={mutation.isPending}
            onClick={onClose}
          >
            取消
          </DialogActionButton>
          <DialogActionButton
            action="confirm"
            disabled={
              mutation.isPending ||
              rolesQuery.isError ||
              bindingQuery.isError ||
              !selectedRoleId
            }
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? '保存中…' : '保存'}
          </DialogActionButton>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function DisableUserDialog({
  user,
  isPending,
  onClose,
  onConfirm,
}: {
  user: UserResource | null;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ResponsiveDialog
      open={Boolean(user)}
      onOpenChange={(open) => !open && !isPending && onClose()}
    >
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>确认停用用户</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            停用后，{user?.user_name ?? '该用户'} 将无法继续登录。是否继续？
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogFooter>
          <DialogActionButton
            action="cancel"
            variant="outline"
            disabled={isPending}
            onClick={onClose}
          >
            取消
          </DialogActionButton>
          <DialogActionButton
            action="confirm"
            variant="destructive"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? '停用中…' : '确认停用'}
          </DialogActionButton>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function UserField({
  label,
  className,
  children,
}: React.PropsWithChildren<{ label: string; className?: string }>) {
  return (
    <div className={className}>
      <Label className="mb-1.5">{label}</Label>
      {children}
    </div>
  );
}

async function updateUserStatus(userId: number, status: StatusFlag) {
  const response = await http.put<UserResource, { status: StatusFlag }>(
    `/system/users/${userId}/status`,
    { status },
  );
  return response.data;
}

async function updateUser(
  user: UserResource,
  values: {
    nick_name: string;
    email: string;
    phone_number: string;
    sex: string;
    remark: string;
  },
) {
  const response = await http.put<UserResource, Record<string, unknown>>(
    `/system/users/${user.user_id}`,
    {
      user_name: user.user_name,
      user_type: user.user_type,
      avatar: user.avatar,
      status: user.status,
      ...values,
    },
  );
  return response.data;
}

async function listAssignableRoles() {
  const response = await http.get<PageResponse<RoleResource>>('/system/roles', {
    page_size: 100,
    assignable_only: true,
  });
  return response.data.list;
}

async function getUserRole(userId: number) {
  const response = await http.get<{ role_id: number }>(
    `/system/users/${userId}/roles`,
  );
  return response.data;
}

async function setUserRole(userId: number, roleId: number) {
  await http.put<void, { role_id: number }>(`/system/users/${userId}/roles`, {
    role_id: roleId,
  });
}
