import { Card, CardContent } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { InviteShareTabs } from '@/features/account/profile/invite/components/invite-share-tabs';
import {
  InviteLoadingState,
  InviteStateCard,
} from '@/features/account/profile/invite/components/invite-states';
import { InvitedFriendTable } from '@/features/account/profile/invite/components/invited-friend-table';
import {
  buildInviteUrl,
  isInviteOverviewUsable,
  normalizeInviteUrl,
} from '@/features/account/profile/invite/invite-utils';
import { getCurrentUserInvite } from '@/features/auth/api';
import { Mail01Icon, UserGroupIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useQuery } from '@tanstack/react-query';

const userInviteQueryKey = ['auth', 'referral-link'] as const;

export function AccountInvitePage() {
  const inviteQuery = useQuery({
    queryKey: userInviteQueryKey,
    queryFn: getCurrentUserInvite,
  });
  const overview = inviteQuery.data;
  const friends = overview?.invited_friends ?? [];
  const activeCount = friends.filter((friend) => friend.status === '0').length;
  const inviteUrl =
    normalizeInviteUrl(overview?.invite_url) ||
    buildInviteUrl(overview?.invite_code ?? '');
  const invitedCount =
    typeof overview?.used_count === 'number'
      ? overview.used_count
      : friends.length;
  const canShareInvite = Boolean(inviteUrl) && isInviteOverviewUsable(overview);

  if (inviteQuery.isLoading) return <InviteLoadingState />;
  if (inviteQuery.error) {
    return (
      <InviteStateCard
        icon={UserGroupIcon}
        title="无法读取邀请信息"
        description={
          inviteQuery.error instanceof Error
            ? inviteQuery.error.message
            : '请稍后重试。'
        }
      />
    );
  }

  return (
    <Card
      size="sm"
      className="overflow-visible bg-transparent p-0 shadow-none ring-0 data-[size=sm]:py-0"
    >
      <CardContent className="flex flex-col gap-3 p-0 group-data-[size=sm]/card:px-0">
        <InviteShareTabs
          inviteUrl={canShareInvite ? inviteUrl : ''}
          invitedCount={invitedCount}
          activeCount={activeCount}
        />
        <div className="rounded-lg border bg-card p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-sm font-medium">已邀请好友</div>
            <div className="text-xs text-muted-foreground">
              {friends.length} 人
            </div>
          </div>
          {friends.length ? (
            <InvitedFriendTable friends={friends} />
          ) : (
            <Empty className="min-h-44 rounded-md">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} />
                </EmptyMedia>
                <EmptyTitle>暂无邀请记录</EmptyTitle>
                <EmptyDescription>
                  好友通过你的邀请链接或邮件注册后，会显示在这里。
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
