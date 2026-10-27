import { apiFetch } from '@/lib/http/api-fetch';
import type {
  ApiResponse,
  BackendErrorResponse,
  BackendResponse,
  HttpResponse,
  RequestOptions,
} from '@/lib/http/types';
import { HttpError } from '@/lib/http/types';
import { getUrlPath, isSuccessCode } from '@/lib/http/url';

export async function sendHttpRequest(
  fullURL: string,
  fetchOptions: Omit<RequestOptions, 'params' | 'data'>,
  headers: Record<string, string>,
  body: BodyInit | null | undefined,
): Promise<HttpResponse> {
  const response = await apiFetch(fullURL, {
    ...fetchOptions,
    credentials: fetchOptions.credentials ?? 'omit',
    headers,
    body,
  });
  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });
  return {
    status: response.status,
    ok: response.ok,
    headers: responseHeaders,
    body: await response.text(),
  };
}

export function parseHttpResponse<T>(
  response: HttpResponse,
  requestUrl?: string,
): ApiResponse<T> {
  const contentType = getHeader(response.headers, 'content-type');
  // An API call answered with a web page means the request missed the API
  // (wrong base URL or a path without /api), never a valid result.
  if (contentType?.includes('text/html')) {
    const path = requestUrl ? getUrlPath(requestUrl) : '';
    throw new HttpError(
      response.status,
      'UNEXPECTED_HTML',
      `接口返回了网页而不是数据${path ? `（${path}）` : ''}，请检查 API 地址`,
    );
  }
  if (contentType?.includes('application/json')) {
    const jsonResponse = parseJsonResponseBody(response.body) as
      BackendResponse<T> | BackendErrorResponse;
    if (!response.ok) {
      throw new HttpError(
        response.status,
        jsonResponse.code ?? 'HTTP_ERROR',
        jsonResponse.message ||
          jsonResponse.msg ||
          defaultStatusText(response.status),
        'details' in jsonResponse ? jsonResponse.details : null,
      );
    }
    if (
      typeof jsonResponse.code === 'number' &&
      !isSuccessCode(jsonResponse.code)
    ) {
      throw new HttpError(
        response.status,
        jsonResponse.code,
        jsonResponse.message || jsonResponse.msg || '请求失败',
      );
    }
    return {
      data: (jsonResponse as BackendResponse<T>).data,
      code:
        typeof jsonResponse.code === 'number' ? jsonResponse.code : undefined,
      message: jsonResponse.message,
      msg: jsonResponse.msg,
      status: response.status,
      ok: response.ok,
    };
  }

  if (!response.ok) {
    throw new HttpError(
      response.status,
      'HTTP_ERROR',
      defaultStatusText(response.status),
    );
  }
  return {
    data: (contentType?.startsWith('text/')
      ? response.body
      : new Blob([response.body])) as T,
    status: response.status,
    ok: response.ok,
  };
}

export function getHeader(headers: Record<string, string>, target: string) {
  const normalizedTarget = target.toLowerCase();
  const entry = Object.entries(headers).find(
    ([key]) => key.toLowerCase() === normalizedTarget,
  );
  return entry?.[1] ?? null;
}

export function deleteHeader(headers: Record<string, string>, target: string) {
  Object.keys(headers).forEach((key) => {
    if (key.toLowerCase() === target.toLowerCase()) {
      Reflect.deleteProperty(headers, key);
    }
  });
}

export function parseJsonResponseBody(body: string) {
  return body ? JSON.parse(body) : {};
}

export function defaultStatusText(status: number) {
  return `HTTP ${status}`;
}
