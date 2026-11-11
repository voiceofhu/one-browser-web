import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AnimatedSegmentedTabs } from '@/components/ui/animated-segmented-tabs';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import { QrCode, createQrCodeSvgMarkup } from '@/components/ui/qr-code';
import { TabsContent } from '@/components/ui/tabs';
import { sendUserInviteEmail } from '@/features/auth/api';
import {
  InviteTurnstileField,
  type TurnstileWidgetHandle,
  isInviteTurnstileEnabled,
} from '@/features/auth/components/invite-turnstile';
import {
  Download01Icon,
  Link01Icon,
  Mail01Icon,
  QrCodeIcon,
  Tick02Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useMutation } from '@tanstack/react-query';
import * as React from 'react';
import { toast } from 'sonner';

const INVITE_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUPPORTED_INVITE_EMAIL_DOMAIN = '@gmail.com';
type InviteShareMode = 'link' | 'email';

const INVITE_SHARE_OPTIONS = [
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
  value: InviteShareMode;
  label: React.ReactNode;
}[];

export function InviteShareTabs({
  activeCount,
  invitedCount,
  inviteUrl,
}: {
  activeCount: number;
  invitedCount: number;
  inviteUrl: string;
}) {
  const [mode, setMode] = React.useState<InviteShareMode>('link');
  return (
    <div className="rounded-lg border bg-card p-3 sm:p-4">
      <AnimatedSegmentedTabs
        label="邀请方式"
        value={mode}
        options={INVITE_SHARE_OPTIONS}
        onValueChange={setMode}
        className="flex min-w-0 flex-col gap-3"
      >
        <TabsContent value="link" className="mt-0">
          <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="flex min-w-0 flex-col gap-2.5">
              <div className="flex min-w-0 flex-col gap-1">
                <div className="text-sm font-medium">邀请链接</div>
                <div className="text-xs text-muted-foreground">
                  复制完整链接发送给好友，或让对方扫码打开。
                </div>
              </div>
              <CopyInviteLink value={inviteUrl} />
              <InviteStats
                invitedCount={invitedCount}
                activeCount={activeCount}
              />
            </div>
            <InviteQrPanel inviteUrl={inviteUrl} />
          </div>
        </TabsContent>
        <TabsContent value="email" className="mt-0">
          <UserInviteEmailForm disabled={!inviteUrl} />
        </TabsContent>
      </AnimatedSegmentedTabs>
    </div>
  );
}

function InviteStats({
  activeCount,
  invitedCount,
}: {
  activeCount: number;
  invitedCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span>
        已邀请{' '}
        <span className="font-medium text-foreground">{invitedCount}</span>
      </span>
      <span>
        正常 <span className="font-medium text-foreground">{activeCount}</span>
      </span>
    </div>
  );
}

function UserInviteEmailForm({ disabled }: { disabled: boolean }) {
  const [email, setEmail] = React.useState('');
  const [sentEmail, setSentEmail] = React.useState('');
  const [turnstileToken, setTurnstileToken] = React.useState('');
  const turnstileRef = React.useRef<TurnstileWidgetHandle>(null);
  const turnstileEnabled = isInviteTurnstileEnabled();
  const sendMutation = useMutation({ mutationFn: sendUserInviteEmail });
  const normalizedEmail = email.trim().toLowerCase();
  const isEmailFormatValid = INVITE_EMAIL_PATTERN.test(normalizedEmail);
  const isSupportedInviteEmail = normalizedEmail.endsWith(
    SUPPORTED_INVITE_EMAIL_DOMAIN,
  );
  const isEmailValid = isEmailFormatValid && isSupportedInviteEmail;
  const canSend =
    !disabled &&
    !sendMutation.isPending &&
    isEmailValid &&
    (!turnstileEnabled || Boolean(turnstileToken));

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isEmailFormatValid) {
      toast.error('请输入有效邮箱');
      return;
    }
    if (!isSupportedInviteEmail) {
      toast.error('目前仅支持邀请 Gmail 邮箱用户');
      return;
    }
    if (turnstileEnabled && !turnstileToken) {
      toast.error('请先完成人机验证');
      return;
    }

    sendMutation.mutate(
      { email: normalizedEmail, turnstile_token: turnstileToken || undefined },
      {
        onSuccess: () => {
          setSentEmail(normalizedEmail);
          setEmail('');
          toast.success('邀请邮件已发送');
        },
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : '邀请邮件发送失败',
          ),
        onSettled: () => {
          setTurnstileToken('');
          turnstileRef.current?.reset();
        },
      },
    );
  }

  return (
    <form
      className="flex w-full max-w-[34rem] min-w-0 flex-col gap-3"
      onSubmit={handleSubmit}
    >
      <Field
        className="min-w-0 gap-1"
        data-invalid={email.trim().length > 0 && !isEmailValid}
      >
        <FieldLabel htmlFor="referral-email" className="sr-only">
          好友邮箱
        </FieldLabel>
        <InputGroup className="h-9 bg-background">
          <InputGroupAddon align="inline-start">
            <InputGroupText>
              <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} />
            </InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            id="referral-email"
            type="email"
            value={email}
            aria-invalid={email.trim().length > 0 && !isEmailValid}
            disabled={disabled || sendMutation.isPending}
            placeholder="好友邮箱"
            autoComplete="email"
            className="text-sm"
            onChange={(event) => {
              setEmail(event.target.value);
              setSentEmail('');
            }}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="submit"
              variant="default"
              size="sm"
              disabled={!canSend}
            >
              <HugeiconsIcon
                icon={Mail01Icon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              {sendMutation.isPending ? '发送中...' : '发送邮件'}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <FieldDescription>目前仅支持 Gmail 邮箱用户。</FieldDescription>
      </Field>
      {sentEmail ? (
        <Alert variant="success">
          <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} aria-hidden="true" />
          <AlertTitle>邀请邮件已发送</AlertTitle>
          <AlertDescription className="break-all">
            已向 {sentEmail} 发送邀请，对方使用 Gmail 登录后即可完成绑定。
          </AlertDescription>
        </Alert>
      ) : null}
      {turnstileEnabled ? (
        <InviteTurnstileField
          ref={turnstileRef}
          className="max-w-[300px]"
          onTokenChange={setTurnstileToken}
          onError={() => toast.error('人机验证加载失败，请刷新后重试')}
        />
      ) : null}
    </form>
  );
}

function CopyInviteLink({ value }: { value: string }) {
  return (
    <Field className="min-w-0 gap-1.5">
      <FieldLabel htmlFor="referral-url" className="sr-only">
        邀请链接
      </FieldLabel>
      <InputGroup className="h-8 bg-background">
        <InputGroupInput
          id="referral-url"
          value={value || '-'}
          readOnly
          title={value || '-'}
          className="font-mono text-sm"
        />
        <InputGroupAddon align="inline-end">
          <CopyButton
            variant="ghost"
            size="icon-sm"
            text={value}
            disabled={!value}
            idleLabel="复制邀请链接"
            copiedLabel="已复制"
            successMessage="邀请链接已复制"
            errorMessage="邀请链接复制失败"
          />
        </InputGroupAddon>
      </InputGroup>
    </Field>
  );
}

function InviteQrPanel({ inviteUrl }: { inviteUrl: string }) {
  return (
    <div className="flex shrink-0 items-center gap-3 md:w-32 md:flex-col md:justify-center">
      <div className="rounded-md bg-white p-1.5 shadow-sm ring-1 ring-border">
        {inviteUrl ? (
          <QrCode value={inviteUrl} size={88} />
        ) : (
          <div className="size-[88px]" />
        )}
      </div>
      <InviteQrDialog inviteUrl={inviteUrl} />
    </div>
  );
}

function InviteQrDialog({ inviteUrl }: { inviteUrl: string }) {
  async function downloadQrCode() {
    if (!inviteUrl) return;
    try {
      downloadBlob(
        await createQrCodePngBlob(inviteUrl),
        'one-browser-invite-qrcode.png',
      );
    } catch {
      downloadBlob(
        new Blob([createQrCodeSvgMarkup(inviteUrl)], {
          type: 'image/svg+xml;charset=utf-8',
        }),
        'one-browser-invite-qrcode.svg',
      );
    }
    toast.success('二维码已下载');
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={!inviteUrl}>
          <HugeiconsIcon
            icon={QrCodeIcon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          二维码
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[min(calc(100vw-2rem),22rem)] sm:max-w-[22rem]">
        <DialogHeader>
          <DialogTitle>邀请二维码</DialogTitle>
          <DialogDescription>扫码打开完整邀请链接。</DialogDescription>
        </DialogHeader>
        <div className="flex min-w-0 flex-col items-center gap-3">
          <div className="flex size-56 max-w-full items-center justify-center rounded-lg bg-white p-3 shadow-sm ring-1 ring-border">
            <QrCode value={inviteUrl} size={192} className="max-w-full" />
          </div>
          <div
            className="w-full min-w-0 truncate rounded-md bg-muted/50 px-2 py-1.5 text-center font-mono text-[0.6875rem] text-muted-foreground"
            title={inviteUrl}
          >
            {inviteUrl}
          </div>
        </div>
        <DialogFooter className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:justify-stretch">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            disabled={!inviteUrl}
            onClick={() => void downloadQrCode()}
          >
            <HugeiconsIcon
              icon={Download01Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            下载
          </Button>
          <CopyButton
            text={inviteUrl}
            variant="default"
            size="sm"
            className="w-full"
            idleLabel="复制邀请链接"
            copiedLabel="已复制"
            successMessage="邀请链接已复制"
            errorMessage="邀请链接复制失败"
          >
            复制链接
          </CopyButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

async function createQrCodePngBlob(value: string) {
  const size = 1024;
  const image = await loadImage(
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(createQrCodeSvgMarkup(value, size))}`,
  );
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('canvas context unavailable');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, size, size);
  context.drawImage(image, 0, 0, size, size);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('png export failed'))),
      'image/png',
    );
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('image load failed'));
    image.src = src;
  });
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
