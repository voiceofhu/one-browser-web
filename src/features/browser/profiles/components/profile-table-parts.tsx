import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialogActionButton,
  AlertDialogCancelButton,
} from '@/components/ui/dialog-action-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ProfileListItem } from '@/features/browser/contracts';
import { formatDateTimeTitle, formatDisplayDateTime } from '@/lib/date-time';
import {
  Copy01Icon,
  Delete02Icon,
  Edit02Icon,
  MoreVerticalIcon,
  MultiplicationSignIcon,
  PlayIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { toast } from '@/components/ui/toast';

import { CountryFlag, resolveCountryCode } from '../../components/country-flag';
import { normalizeProfileGroup } from '../group-utils';
import { proxyLabel } from '../model/profile-list';

export function CreatedAtCell({ profile }: { profile: ProfileListItem }) {
  const group = normalizeProfileGroup(profile.groupId);

  return (
    <div className="flex min-w-28 flex-col items-center justify-center gap-1 text-center">
      <span
        className="tabular-nums"
        title={formatDateTimeTitle(profile.createdAt)}
      >
        {formatDisplayDateTime(profile.createdAt)}
      </span>
      {group ? (
        <span
          className="text-muted-foreground max-w-28 truncate text-xs"
          title={group}
        >
          {group}
        </span>
      ) : null}
    </div>
  );
}

export function EnvironmentCell({
  onEdit,
  profile,
}: {
  onEdit: (profileId: string) => void;
  profile: ProfileListItem;
}) {
  return (
    <div className="flex min-w-56 flex-col gap-1">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          className="focus-visible:ring-ring/30 min-w-0 truncate text-left font-medium underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:outline-none"
          title={profile.name}
          aria-label={`编辑环境 ${profile.name}`}
          onClick={() => onEdit(profile.profileId)}
        >
          {profile.name}
        </button>
        {profile.pid ? (
          <Badge
            asChild
            variant="outline"
            className="h-5 cursor-copy px-1.5 font-mono tabular-nums"
          >
            <button
              type="button"
              aria-label={`复制 PID ${profile.pid}`}
              title={`复制 PID ${profile.pid}`}
              onClick={() => void copyProfilePid(profile.pid)}
            >
              PID {profile.pid}
            </button>
          </Badge>
        ) : null}
        {profile.tags.slice(0, 3).map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="h-5 shrink-0 px-1.5 text-[0.625rem]"
          >
            {tag}
          </Badge>
        ))}
        {profile.tags.length > 3 ? (
          <Badge
            variant="outline"
            className="h-5 shrink-0 px-1.5 text-[0.625rem]"
          >
            +{profile.tags.length - 3}
          </Badge>
        ) : null}
      </div>
      <span
        className="text-muted-foreground truncate"
        title={formatDateTimeTitle(profile.lastOpenAt)}
      >
        上次启动：
        {formatDisplayDateTime(profile.lastOpenAt, '没有启动时间')}
      </span>
    </div>
  );
}

export function ProxyCell({
  onSwitchProxy,
  profile,
}: {
  onSwitchProxy: (profile: ProfileListItem) => void;
  profile: ProfileListItem;
}) {
  const code = resolveCountryCode(
    profile.proxyCountryCode,
    profile.proxyCountry,
  );
  const locationCode = code ?? profile.proxyCountry?.trim() ?? '未知国家';
  const location = profile.proxyExitIp
    ? `${locationCode} (${profile.proxyExitIp})`
    : locationCode;
  const locationTitle = [
    profile.proxyCountry,
    profile.proxyRegion,
    profile.proxyExitIp,
  ]
    .filter(Boolean)
    .join(' / ');

  return (
    <div className="flex min-w-44 flex-col gap-1">
      <button
        type="button"
        className="focus-visible:ring-ring/30 w-full min-w-0 truncate text-left font-medium underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:outline-none"
        title={profile.proxyUrl}
        onClick={() => onSwitchProxy(profile)}
      >
        {profile.proxyUrl || proxyLabel(profile.proxySummary)}
      </button>
      <div className="text-muted-foreground flex min-w-0 items-center gap-2">
        <CountryFlag code={code} country={profile.proxyCountry} />
        <span className="truncate" title={locationTitle || location}>
          {location}
        </span>
      </div>
    </div>
  );
}

export function RowActions({
  profile,
  isDeleting,
  isDuplicating,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  profile: ProfileListItem;
  isDeleting: boolean;
  isDuplicating: boolean;
  onEdit: (profileId: string) => void;
  onDuplicate: (profileId: string) => void;
  onDelete: (profileId: string) => void;
}) {
  const deleteDisabledReason = isDeleting
    ? '正在删除，请稍候'
    : profile.status !== 'inactive'
      ? '已启动或启动中的环境不能删除，请先关闭'
      : undefined;
  const deleteItem = (
    <DropdownMenuItem
      variant="destructive"
      aria-disabled={Boolean(deleteDisabledReason)}
      className={
        deleteDisabledReason
          ? 'focus:text-destructive cursor-not-allowed opacity-50 focus:bg-transparent'
          : undefined
      }
      onSelect={(event) => {
        if (deleteDisabledReason) {
          event.preventDefault();
          return;
        }
        onDelete(profile.profileId);
      }}
    >
      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
      删除
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon-sm" variant="ghost" aria-label="打开环境操作">
          <HugeiconsIcon icon={MoreVerticalIcon} strokeWidth={2} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => onEdit(profile.profileId)}>
            <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
            编辑
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isDuplicating}
            onSelect={() => onDuplicate(profile.profileId)}
          >
            <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
            复制
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {deleteDisabledReason ? (
            <Tooltip>
              <TooltipTrigger asChild>{deleteItem}</TooltipTrigger>
              <TooltipContent side="left">
                {deleteDisabledReason}
              </TooltipContent>
            </Tooltip>
          ) : (
            deleteItem
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DeleteProfilesConfirmDialog({
  profileIds,
  isDeleting,
  onOpenChange,
  onConfirm,
}: {
  profileIds: string[];
  isDeleting?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (profileIds: string[]) => void;
}) {
  const count = profileIds.length;
  const title = count > 1 ? `删除 ${count} 个环境？` : '删除这个环境？';
  const description =
    count > 1
      ? `将删除选中的 ${count} 个环境配置，浏览器数据目录会保留。此操作不可撤销。`
      : '将删除这个环境配置，浏览器数据目录会保留。此操作不可撤销。';

  return (
    <AlertDialog open onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancelButton disabled={isDeleting} />
          <AlertDialogActionButton
            variant="destructive"
            disabled={isDeleting}
            loading={isDeleting}
            loadingText="删除中..."
            onClick={(event) => {
              event.preventDefault();
              onConfirm(profileIds);
            }}
          >
            确认删除
          </AlertDialogActionButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ProfileBulkActions({
  selectedCount,
  openableCount,
  deleteCount,
  isDeleting,
  isOpening,
  openDisabled,
  openDisabledTitle,
  deleteDisabled,
  deleteDisabledTitle,
  onClear,
  onOpen,
  onDelete,
}: {
  selectedCount: number;
  openableCount: number;
  deleteCount: number;
  isDeleting?: boolean;
  isOpening?: boolean;
  openDisabled?: boolean;
  openDisabledTitle?: string;
  deleteDisabled?: boolean;
  deleteDisabledTitle?: string;
  onClear: () => void;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const deleteButton = (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={deleteDisabled || isDeleting}
      title={deleteDisabledTitle}
      onClick={onDelete}
    >
      {isDeleting ? (
        <Spinner data-icon="inline-start" />
      ) : (
        <HugeiconsIcon
          icon={Delete02Icon}
          strokeWidth={2}
          data-icon="inline-start"
        />
      )}
      {isDeleting ? '删除中' : `删除 ${deleteCount}`}
    </Button>
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 flex justify-center px-4 md:left-(--sidebar-width)">
      <div className="bg-popover text-popover-foreground pointer-events-auto flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-lg border p-2 shadow-lg">
        <Badge
          variant="outline"
          className="bg-muted/40 h-6 rounded-md px-2.5 text-xs"
        >
          <span className="font-semibold tabular-nums">{selectedCount}</span>
          <span className="text-muted-foreground">已选</span>
        </Badge>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="清除选择"
          onClick={onClear}
        >
          <HugeiconsIcon icon={MultiplicationSignIcon} strokeWidth={2} />
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-busy={isOpening || undefined}
          disabled={openDisabled}
          title={openDisabledTitle}
          onClick={onOpen}
        >
          {isOpening ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <HugeiconsIcon
              icon={PlayIcon}
              strokeWidth={2}
              data-icon="inline-start"
            />
          )}
          {isOpening ? '打开中' : `打开 ${openableCount}`}
        </Button>
        {deleteDisabled && deleteDisabledTitle ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex" tabIndex={0}>
                {deleteButton}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">{deleteDisabledTitle}</TooltipContent>
          </Tooltip>
        ) : (
          deleteButton
        )}
      </div>
    </div>
  );
}

async function copyProfilePid(pid: number | null) {
  if (!pid) return;
  try {
    await copyText(String(pid));
    toast.success('已复制 PID');
  } catch {
    toast.error('复制失败');
  }
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      fallbackCopyText(text);
      return;
    }
  }
  fallbackCopyText(text);
}

function fallbackCopyText(text: string) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);
  if (!copied) throw new Error('copy failed');
}
