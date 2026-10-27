import { describe, expect, it } from 'vitest';

import { parseHttpResponse } from './transport';

describe('parseHttpResponse', () => {
  it('rejects a web page returned for an API call and names the path', () => {
    expect(() =>
      parseHttpResponse(
        {
          status: 200,
          ok: true,
          headers: { 'content-type': 'text/html; charset=utf-8' },
          body: '<!doctype html><html></html>',
        },
        'https://browser.aicbe.com/auth/app/permissions',
      ),
    ).toThrow('接口返回了网页而不是数据（/auth/app/permissions）');
  });

  it('still returns JSON data', () => {
    const result = parseHttpResponse<{ team_permissions: string[] }>({
      status: 200,
      ok: true,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 200, data: { team_permissions: ['*'] } }),
    });
    expect(result.data.team_permissions).toEqual(['*']);
  });
});
