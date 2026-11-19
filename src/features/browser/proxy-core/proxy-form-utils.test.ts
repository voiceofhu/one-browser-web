import { describe, expect, it } from 'vitest';

import { parseHostPortInput, proxyTypeFromScheme } from './proxy-form-utils';

describe('parseHostPortInput socks5 links', () => {
  it('parses a no-auth One Node link', () => {
    expect(parseHostPortInput('socks5://127.0.0.1:23456')).toMatchObject({
      type: 'socks5',
      host: '127.0.0.1',
      port: '23456',
      username: '',
      password: '',
    });
  });

  it('decodes percent-encoded credentials', () => {
    expect(
      parseHostPortInput('socks5://user:p%40ss@127.0.0.1:23456'),
    ).toMatchObject({
      type: 'socks5',
      host: '127.0.0.1',
      port: '23456',
      username: 'user',
      password: 'p@ss',
    });
  });

  it('treats socks5h as socks5', () => {
    expect(parseHostPortInput('socks5h://127.0.0.1:23456')).toMatchObject({
      type: 'socks5',
      host: '127.0.0.1',
      port: '23456',
    });
    expect(parseHostPortInput('SOCKS5H://u:p@[::1]:1080')).toMatchObject({
      type: 'socks5',
      host: '::1',
      port: '1080',
      username: 'u',
      password: 'p',
    });
  });

  it('keeps http and leaves unknown schemes untyped', () => {
    expect(parseHostPortInput('http://127.0.0.1:7890')?.type).toBe('http');
    expect(parseHostPortInput('vmess://127.0.0.1:7890')?.type).toBeUndefined();
    expect(proxyTypeFromScheme(undefined)).toBeUndefined();
  });
});
