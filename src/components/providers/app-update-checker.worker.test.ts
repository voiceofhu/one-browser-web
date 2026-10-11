/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const manifestUrl = 'https://example.test/app-version.json';

function startWorker(fetch: ReturnType<typeof vi.fn>) {
  let receive: (event: { data: unknown }) => void = () => {};
  const postMessage = vi.fn();
  runInNewContext(readFileSync('public/app-update-checker.worker.js', 'utf8'), {
    URL,
    AbortSignal,
    Date,
    Error,
    Set,
    fetch,
    self: {
      addEventListener: (_type: string, handler: typeof receive) => {
        receive = handler;
      },
      postMessage,
    },
  });
  return {
    postMessage,
    check: (build: string) =>
      receive({ data: { type: 'check', url: manifestUrl, build } }),
  };
}

async function lastResult(
  worker: ReturnType<typeof startWorker>,
  build: string,
) {
  const calls = worker.postMessage.mock.calls.length;
  worker.check(build);
  await vi.waitFor(() =>
    expect(worker.postMessage.mock.calls.length).toBe(calls + 1),
  );
  return worker.postMessage.mock.lastCall?.[0];
}

describe('app version manifest worker', () => {
  it('compares the running build with the deployed manifest without a baseline', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ build: 'same' }))
      .mockResolvedValueOnce(Response.json({ build: 'new' }));
    const worker = startWorker(fetch);
    expect(await lastResult(worker, 'same')).toEqual({ type: 'unchanged' });
    expect(await lastResult(worker, 'same')).toEqual({ type: 'changed' });
    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).toMatch(
      /^https:\/\/example\.test\/app-version\.json\?t=\d+$/,
    );
    expect(init).toEqual(
      expect.objectContaining({
        cache: 'no-store',
        credentials: 'same-origin',
      }),
    );
  });

  it('reports missing or invalid manifests as errors, never as updates', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response('missing', { status: 404 }))
      .mockResolvedValueOnce(Response.json({}))
      .mockRejectedValueOnce(new Error('offline'));
    const worker = startWorker(fetch);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      expect(await lastResult(worker, 'old')).toEqual(
        expect.objectContaining({ type: 'error' }),
      );
    }
  });

  it('ignores malformed messages and deduplicates concurrent checks', async () => {
    let resolve: (response: Response) => void = () => {};
    const fetch = vi.fn(
      () => new Promise<Response>((done) => (resolve = done)),
    );
    const worker = startWorker(fetch);
    worker.check(undefined as unknown as string);
    worker.check('old');
    worker.check('old');
    expect(fetch).toHaveBeenCalledTimes(1);
    resolve(Response.json({ build: 'new' }));
    await vi.waitFor(() =>
      expect(worker.postMessage).toHaveBeenCalledWith({ type: 'changed' }),
    );
  });
});
