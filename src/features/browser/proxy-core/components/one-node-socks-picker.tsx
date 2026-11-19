import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { OneNodeSocksPort } from '@/features/browser/contracts';
import { isTauriRuntime } from '@/lib/desktop';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

import { listOneNodeSocks } from '../one-node-api';

export const ONE_NODE_UNAVAILABLE_TEXT =
  '未检测到 One Node PC 的本地 SOCKS5，可在 One Node PC 节点详情里开启';

/**
 * One Node PC's local SOCKS5 ports. Desktop only: the web build has no Tauri,
 * so the query never runs there and `visible` stays false.
 */
export function useOneNodeSocks() {
  const enabled = isTauriRuntime();
  const query = useQuery({
    queryKey: ['one-node-socks'],
    queryFn: listOneNodeSocks,
    enabled,
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const data = query.data;
  // Render nothing unless local-socks.json exists (One Node PC installed and
  // the feature used once); a failed command counts as not installed.
  const visible = enabled && query.isSuccess && Boolean(data?.installed);
  // The picker needs at least one running port; otherwise show the hint.
  const available = Boolean(
    data?.available && data.ports.some((port) => port.reachable),
  );
  return {
    visible,
    available,
    ports: available ? (query.data?.ports ?? []) : [],
    refresh: () => void query.refetch(),
  };
}

export function formatOneNodeAddress(port: OneNodeSocksPort) {
  const host = port.host.includes(':') ? `[${port.host}]` : port.host;
  return `${host}:${port.port}`;
}

export function OneNodeSocksSelect({
  className,
  id,
  onOpen,
  onPick,
  ports,
}: {
  className?: string;
  id?: string;
  onOpen: () => void;
  onPick: (port: OneNodeSocksPort) => void;
  ports: OneNodeSocksPort[];
}) {
  return (
    <Select
      value=""
      onOpenChange={(open) => {
        if (open) onOpen();
      }}
      onValueChange={(link) => {
        const port = ports.find((item) => item.link === link);
        if (port) onPick(port);
      }}
    >
      <SelectTrigger id={id} className={cn('w-full', className)}>
        <SelectValue placeholder="从 One Node 选择" />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectGroup>
          {ports.map((port) => (
            <SelectItem
              key={port.link}
              value={port.link}
              disabled={!port.reachable}
            >
              <span className="truncate">
                {port.name} · {formatOneNodeAddress(port)}
              </span>
              {port.reachable ? null : (
                <span className="text-muted-foreground">未运行</span>
              )}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

/** Proxy editor row: the picker, or one muted line when no port is running. */
export function OneNodeSocksPicker({
  onPick,
}: {
  onPick: (port: OneNodeSocksPort) => void;
}) {
  const { available, ports, refresh, visible } = useOneNodeSocks();
  if (!visible) return null;
  if (!available) {
    return (
      <p className="text-muted-foreground text-xs leading-relaxed">
        {ONE_NODE_UNAVAILABLE_TEXT}
      </p>
    );
  }
  return (
    <OneNodeSocksSelect
      id="proxy-one-node"
      ports={ports}
      onOpen={refresh}
      onPick={onPick}
    />
  );
}
