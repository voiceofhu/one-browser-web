import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DefaultUserAvatar } from '@/features/account/avatar';
import { getDefaultUserAvatarSeed } from '@/features/account/avatar';
import { formatFullDateTime } from '@/features/account/profile/invite/invite-utils';
import { formatDisplayDateTime } from '@/lib/date-time';
import type { UserInviteFriend } from '@/features/auth/api';

export function InvitedFriendTable({
  friends,
}: {
  friends: UserInviteFriend[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>邮箱</TableHead>
          <TableHead>注册时间</TableHead>
          <TableHead className="w-20 text-right">状态</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {friends.map((friend) => (
          <TableRow key={friend.user_id}>
            <TableCell>
              <div className="flex min-w-0 items-center gap-2">
                <Avatar className="size-8" size="sm">
                  <AvatarImage
                    src={friend.avatar || undefined}
                    alt={friend.email}
                  />
                  <AvatarFallback className="overflow-hidden p-0">
                    <DefaultUserAvatar
                      seed={getDefaultUserAvatarSeed(
                        friend.user_id,
                        friend.email,
                        friend.user_name,
                        friend.nick_name,
                      )}
                    />
                  </AvatarFallback>
                </Avatar>
                <span className="block min-w-0 truncate" title={friend.email}>
                  {friend.email || '-'}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">
              <span title={formatFullDateTime(friend.created_at)}>
                {formatDisplayDateTime(friend.created_at)}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <StatusBadge status={friend.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === '0';
  return (
    <Badge variant={isActive ? 'secondary' : 'outline'}>
      {isActive ? '正常' : '停用'}
    </Badge>
  );
}
