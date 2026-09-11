/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

function startWorker(fetch: ReturnType<typeof vi.fn>) {
  let receive: (event: { data: unknown }) => void = () => {};
  const postMessage = vi.fn();
  runInNewContext(readFileSync('public/app-update-checker.worker.js', 'utf8'), {
    URL, fetch,
    self: {
      location: { origin: 'https://example.test' },
      addEventListener: (_type: string, handler: typeof receive) => { receive = handler; },
      postMessage,
    },
  });
  return {
    postMessage,
    check: (url = 'https://example.test/') => receive({ data: { type: 'check', url } }),
  };
}
const response = (etag: string | null, status = 200, modified = 'today') => ({
  ok: status === 200, status,
  headers: new Headers({ ...(etag ? { etag } : {}), 'last-modified': modified }),
  body: { cancel: vi.fn() },
});

describe('ETag update worker', () => {
  it('records a baseline, ignores Last-Modified changes, and detects changed content', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(response('"v1"'))
      .mockResolvedValueOnce(response('"v1"', 200, 'tomorrow'))
      .mockResolvedValueOnce(response('"v2"'));
    const worker = startWorker(fetch);
    for (const type of ['baseline', 'unchanged', 'changed']) {
      worker.check();
      await vi.waitFor(() => expect(worker.postMessage).toHaveBeenLastCalledWith(expect.objectContaining({ type })));
    }
    expect(fetch).toHaveBeenCalledWith('https://example.test/', expect.objectContaining({ method: 'HEAD', cache: 'no-store' }));
  });
  it('does not mistake missing ETags or failures for updates, and permits retry', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(response(null))
      .mockResolvedValueOnce(response(null, 503)).mockResolvedValueOnce(response('"v1"'));
    const worker = startWorker(fetch);
    for (const type of ['unavailable', 'error', 'baseline']) {
      worker.check();
      await vi.waitFor(() => expect(worker.postMessage).toHaveBeenLastCalledWith(expect.objectContaining({ type })));
    }
  });
  it('falls back to GET when HEAD is unsupported', async () => {
    const document = response('"v1"');
    const fetch = vi.fn().mockResolvedValueOnce(response(null, 405)).mockResolvedValueOnce(document);
    const worker = startWorker(fetch);
    worker.check();
    await vi.waitFor(() => expect(worker.postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'baseline' })));
    expect(fetch.mock.calls[1]?.[1].method).toBe('GET');
    expect(document.body.cancel).toHaveBeenCalled();
  });
  it('rejects other origins and deduplicates concurrent checks after URL normalization', async () => {
    const fetch = vi.fn().mockResolvedValue(response('"v1"'));
    const worker = startWorker(fetch);
    worker.check('https://other.test/');
    expect(fetch).not.toHaveBeenCalled();
    worker.check('https://example.test/?t=1#section');
    worker.check('https://example.test/');
    await vi.waitFor(() => expect(worker.postMessage).toHaveBeenCalledTimes(1));
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
