import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/loading-state';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { UserGroupIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

export function InviteLoadingState() {
  return (
    <Card
      size="sm"
      className="overflow-visible bg-transparent p-0 shadow-none ring-0 data-[size=sm]:py-0"
    >
      <CardContent className="p-0 group-data-[size=sm]/card:px-0">
        <LoadingState
          className="bg-card min-h-56 rounded-lg border"
          label="邀请信息加载中..."
        />
      </CardContent>
    </Card>
  );
}

export function InviteStateCard({
  description,
  icon,
  title,
}: {
  description: string;
  icon: typeof UserGroupIcon;
  title: string;
}) {
  return (
    <Card
      size="sm"
      className="overflow-visible bg-transparent p-0 shadow-none ring-0 data-[size=sm]:py-0"
    >
      <CardContent className="p-0 group-data-[size=sm]/card:px-0">
        <Empty className="min-h-56 rounded-lg border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={icon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </CardContent>
    </Card>
  );
}
