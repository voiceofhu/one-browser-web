import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/responsive-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AnimatedSegmentedTabs } from '@/components/ui/animated-segmented-tabs';
import { CopyButton } from '@/components/ui/copy-button';
import { DialogActionButton } from '@/components/ui/dialog-action-button';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import { TabsContent } from '@/components/ui/tabs';
import {
  InviteTurnstileField,
  type TurnstileWidgetHandle,
  isInviteTurnstileEnabled,
} from '@/features/auth/components/invite-turnstile';
import {
  Link01Icon,
  Mail01Icon,
  PlusSignIcon,
  Tick02Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import * as React from 'react';
import { toast } from '@/components/ui/toast';

import type {
  RemoteTeamInvitePayload,
  RemoteTeamInviteResource,
  RemoteTeamInviteRoleResource,
  RemoteTeamResource,
} from '../types';
import {
  type InviteMode,
  InviteRoleSelect,
  InviteTeamSelect,
  getPrimaryActionLabel,
} from './team-invite-fields';

const INVITE_FORM_ID = 'team-invite-form';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUPPORTED_INVITE_EMAIL_DOMAIN = '@gmail.com';
const INVITE_MODE_OPTIONS = [
  {
    value: 'link',
    label: (
      <>
        <HugeiconsIcon
          icon={Link01Icon}
          strokeWidth={2}
          data-icon="inline-start"
        />
        链接邀请
      </>
    ),
  },
  {
    value: 'email',
    label: (
      <>
        <HugeiconsIcon
          icon={Mail01Icon}
          strokeWidth={2}
          data-icon="inline-start"
        />
        邮箱邀请
      </>
    ),
  },
] as const satisfies readonly {
  value: InviteMode;
  label: React.ReactNode;
}[];

export function TeamInviteDialog({
  open,
  teams,
  selectedTeamId,
  selectedTeam,
  roles,
  selectedRoleKey,
  selectedRole,
  invite,
  isLoadingTeams,
  isLoadingRoles,
  hasRoleError,
  isSaving,
  onOpenChange,
  onTeamChange,
  onRoleChange,
  onDraftChange,
  onSubmit,
}: {
  open: boolean;
  teams: RemoteTeamResource[];
  selectedTeamId: number | null;
  selectedTeam: RemoteTeamResource | null;
  roles: RemoteTeamInviteRoleResource[];
  selectedRoleKey: string | null;
  selectedRole: RemoteTeamInviteRoleResource | null;
  invite: RemoteTeamInviteResource | null;
  isLoadingTeams: boolean;
  isLoadingRoles: boolean;
  hasRoleError: boolean;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamChange: (teamId: number) => void;
  onRoleChange: (roleKey: string) => void;
  onDraftChange: () => void;
  onSubmit: (teamId: number, payload: RemoteTeamInvitePayload) => void;
}) {
  const [mode, setMode] = React.useState<InviteMode>('link');
  const [email, setEmail] = React.useState('');
  const [turnstileToken, setTurnstileToken] = React.useState('');
  const turnstileRef = React.useRef<TurnstileWidgetHandle>(null);
  const turnstileEnabled = mode === 'email' && isInviteTurnstileEnabled();
  const isEmailInvite = Boolean(invite?.email);
  const normalizedEmail = email.trim().toLowerCase();
  const isEmailFormatValid = EMAIL_PATTERN.test(normalizedEmail);
  const isSupportedInviteEmail = normalizedEmail.endsWith(
    SUPPORTED_INVITE_EMAIL_DOMAIN,
  );
  const isEmailValid = isEmailFormatValid && isSupportedInviteEmail;
  const canSubmitEmail = mode !== 'email' || isEmailValid;
  const canSubmitTurnstile = !turnstileEnabled || Boolean(turnstileToken);
  const hasSelectedRole = Boolean(
    selectedRoleKey &&
    selectedRole?.role_key === selectedRoleKey &&
    roles.some((role) => role.role_key === selectedRoleKey),
  );
  const invitedRoleName = invite?.role_name ?? selectedRole?.role_name ?? null;
  const primaryActionLabel = getPrimaryActionLabel({
    isSaving,
    mode,
    invite,
    isEmailInvite,
  });
  const canSubmit =
    Boolean(selectedTeam) &&
    hasSelectedRole &&
    !isSaving &&
    !isLoadingTeams &&
    !isLoadingRoles &&
    !hasRoleError &&
    canSubmitEmail &&
    canSubmitTurnstile;

  function resetDraft() {
    setMode('link');
    setEmail('');
    setTurnstileToken('');
    turnstileRef.current?.reset();
  }

  function updateOpen(nextOpen: boolean) {
    if (!nextOpen) {
      resetDraft();
    }

    onOpenChange(nextOpen);
  }

  function updateMode(nextMode: string) {
    setMode(nextMode as InviteMode);
    setTurnstileToken('');
    turnstileRef.current?.reset();
    onDraftChange();
  }

  function updateEmail(nextEmail: string) {
    setEmail(nextEmail);
    onDraftChange();
  }

  function updateRole(nextRoleKey: string) {
    onRoleChange(nextRoleKey);
    onDraftChange();
  }

  function updateTeam(nextTeamId: string) {
    const parsedTeamId = Number(nextTeamId);
    if (!Number.isFinite(parsedTeamId) || parsedTeamId <= 0) {
      return;
    }

    onTeamChange(parsedTeamId);
    onDraftChange();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedTeam || !selectedTeamId) {
      toast.error('请选择团队');
      return;
    }

    if (!hasSelectedRole || !selectedRoleKey) {
      toast.error('请选择角色');
      return;
    }

    if (mode === 'email' && !isEmailFormatValid) {
      toast.error('请输入有效邮箱');
      return;
    }

    if (mode === 'email' && !isSupportedInviteEmail) {
      toast.error('目前仅支持邀请 Gmail 邮箱用户');
      return;
    }

    if (mode === 'email' && turnstileEnabled && !turnstileToken) {
      toast.error('请先完成人机验证');
      return;
    }

    onSubmit(selectedTeamId, {
      role_key: selectedRoleKey,
      ...(mode === 'email'
        ? {
            email: normalizedEmail,
            turnstile_token: turnstileToken || undefined,
          }
        : {}),
    });
    if (mode === 'email') {
      setTurnstileToken('');
      turnstileRef.current?.reset();
    }
  }

  const submitFromShortcut = React.useCallback(() => {
    const form = document.getElementById(INVITE_FORM_ID);
    if (form instanceof HTMLFormElement) {
      form.requestSubmit();
    }
  }, []);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.key !== 'Enter') {
        return;
      }

      if (!event.metaKey && !event.ctrlKey) {
        return;
      }

      if (!canSubmit) {
        return;
      }

      event.preventDefault();
      submitFromShortcut();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canSubmit, open, submitFromShortcut]);

  return (
    <ResponsiveDialog open={open} onOpenChange={updateOpen}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>邀请成员</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            选择团队和角色，再通过链接或邮箱邀请成员。
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="flex flex-col gap-3">
          <form
            id={INVITE_FORM_ID}
            className="flex flex-col gap-3"
            onSubmit={handleSubmit}
          >
            <AnimatedSegmentedTabs
              label="邀请方式"
              value={mode}
              options={INVITE_MODE_OPTIONS}
              onValueChange={updateMode}
              className="flex min-w-0 flex-col gap-3"
              listClassName="h-7 w-fit self-start rounded-md p-0.5"
              triggerClassName="h-6 gap-1 px-2 text-xs"
            >
              <FieldGroup className="gap-2">
                <InviteTeamSelect
                  id="invite-team"
                  teams={teams}
                  selectedTeamId={selectedTeamId}
                  selectedTeam={selectedTeam}
                  isLoading={isLoadingTeams}
                  disabled={isSaving}
                  onValueChange={updateTeam}
                />
                <InviteRoleSelect
                  id="invite-role"
                  roles={roles}
                  selectedRoleKey={hasSelectedRole ? selectedRoleKey : null}
                  selectedRole={hasSelectedRole ? selectedRole : null}
                  isLoading={isLoadingRoles}
                  hasError={hasRoleError}
                  disabled={isSaving || !selectedTeam}
                  onValueChange={updateRole}
                />
              </FieldGroup>

              <TabsContent value="email" className="mt-0">
                <Field className="gap-1">
                  <FieldLabel htmlFor="invite-email" className="text-xs">
                    邮箱地址
                  </FieldLabel>
                  <InputGroup className="bg-background min-h-9 rounded-lg px-0.5">
                    <InputGroupAddon align="inline-start">
                      <InputGroupText>
                        <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} />
                      </InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      id="invite-email"
                      type="email"
                      value={email}
                      aria-invalid={email.trim().length > 0 && !isEmailValid}
                      disabled={isSaving}
                      placeholder="Email address"
                      autoComplete="email"
                      className="text-sm"
                      onChange={(event) => updateEmail(event.target.value)}
                    />
                  </InputGroup>
                  <FieldDescription>
                    目前仅支持 Gmail 邮箱用户，对方登录后将按所选角色加入团队。
                  </FieldDescription>
                </Field>
                {turnstileEnabled ? (
                  <InviteTurnstileField
                    ref={turnstileRef}
                    className="mt-1 max-w-[300px]"
                    onTokenChange={setTurnstileToken}
                    onError={() =>
                      toast.error('人机验证加载失败，请刷新后重试')
                    }
                  />
                ) : null}
              </TabsContent>

              <TabsContent value="link" className="mt-0" />
            </AnimatedSegmentedTabs>
          </form>

          {invite ? (
            <FieldGroup className="border-t pt-3">
              {isEmailInvite ? (
                <Alert variant="success">
                  <HugeiconsIcon
                    icon={Tick02Icon}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <AlertTitle>邀请邮件已发送</AlertTitle>
                  <AlertDescription className="break-all">
                    {invitedRoleName
                      ? `已向 ${invite.email} 发送邀请，对方使用 Gmail 登录后将以「${invitedRoleName}」角色加入当前团队。`
                      : `已向 ${invite.email} 发送邀请，对方使用 Gmail 登录后即可加入当前团队。`}
                  </AlertDescription>
                </Alert>
              ) : (
                <Field className="gap-1">
                  <FieldLabel htmlFor="invite-url" className="text-xs">
                    邀请链接
                  </FieldLabel>
                  <InputGroup className="bg-background h-9 rounded-lg">
                    <InputGroupInput
                      id="invite-url"
                      value={invite.url}
                      readOnly
                      className="truncate text-sm"
                    />
                    <InputGroupAddon align="inline-end">
                      <CopyButton
                        text={invite.url}
                        idleLabel="复制邀请链接"
                        copiedLabel="邀请链接已复制"
                        successMessage="邀请链接已复制"
                        errorMessage="无法复制邀请链接"
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-md"
                      />
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldDescription>
                    {invitedRoleName
                      ? `对方加入后将获得「${invitedRoleName}」角色。`
                      : '对方登录后即可加入当前团队。'}
                  </FieldDescription>
                </Field>
              )}
            </FieldGroup>
          ) : null}
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <DialogActionButton
            action="cancel"
            type="button"
            size="sm"
            onClick={() => updateOpen(false)}
          >
            取消
          </DialogActionButton>
          <DialogActionButton
            type="submit"
            form={INVITE_FORM_ID}
            size="sm"
            disabled={!canSubmit}
            loading={isSaving}
            loadingText={mode === 'email' ? '发送中...' : '生成中...'}
          >
            {!isSaving ? (
              <HugeiconsIcon
                icon={mode === 'email' ? Mail01Icon : PlusSignIcon}
                strokeWidth={2}
                data-icon="inline-start"
              />
            ) : null}
            {primaryActionLabel}
          </DialogActionButton>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
