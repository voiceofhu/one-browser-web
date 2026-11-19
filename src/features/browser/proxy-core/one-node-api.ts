import type { OneNodeSocksList } from '@/features/browser/contracts';
import { desktopInvoke } from '@/lib/desktop';

/** Desktop only: loopback SOCKS5 ports published by One Node PC. */
export function listOneNodeSocks() {
  return desktopInvoke<OneNodeSocksList>('list_one_node_socks');
}
