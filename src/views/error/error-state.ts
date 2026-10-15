export type ErrorKind =
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'timeout'
  | 'rate-limit'
  | 'server'
  | 'bad-gateway'
  | 'unavailable'
  | 'gateway-timeout'
  | 'offline'
  | 'network'
  | 'resource'
  | 'render'
  | 'unknown';

export type ErrorState = {
  kind: ErrorKind;
  code: string;
  status?: number;
  title: string;
  description: string;
  hint: string;
};

const httpStates: Record<
  number,
  Pick<ErrorState, 'kind' | 'title' | 'description' | 'hint'>
> = {
  401: {
    kind: 'unauthorized',
    title: '登录状态已失效',
    description: '当前登录信息已失效，暂时无法继续访问。',
    hint: '请重新登录后再继续操作。',
  },
  403: {
    kind: 'forbidden',
    title: '没有访问权限',
    description: '当前账号无权访问此页面或执行此操作。',
    hint: '请确认当前团队和账号权限，或联系团队管理员。',
  },
  404: {
    kind: 'not-found',
    title: '页面或资源不存在',
    description: '访问的地址不存在，或对应资源已被移除。',
    hint: '请检查访问地址，或返回首页继续使用。',
  },
  408: {
    kind: 'timeout',
    title: '请求超时',
    description: '本次请求未能在规定时间内完成。',
    hint: '请检查网络连接后重试。',
  },
  429: {
    kind: 'rate-limit',
    title: '操作过于频繁',
    description: '请求频率已超过当前允许的范围。',
    hint: '请稍候再试，避免连续重复操作。',
  },
  500: {
    kind: 'server',
    title: '服务处理失败',
    description: '服务端处理请求时出现异常。',
    hint: '请稍后重试；若持续出现，可复制错误详情联系管理员。',
  },
  502: {
    kind: 'bad-gateway',
    title: '网关响应异常',
    description: '网关未能从上游服务取得有效响应。',
    hint: '请稍后重试；若持续出现，可复制错误详情联系管理员。',
  },
  503: {
    kind: 'unavailable',
    title: '服务暂不可用',
    description: '服务当前无法处理本次请求。',
    hint: '请稍后重试；若持续出现，可复制错误详情联系管理员。',
  },
  504: {
    kind: 'gateway-timeout',
    title: '网关等待超时',
    description: '网关等待上游服务响应超时。',
    hint: '请稍后重试；若持续出现，可复制错误详情联系管理员。',
  },
};

export function resolveErrorState(
  error: unknown,
  context: 'page' | 'request' = 'request',
): ErrorState {
  const status =
    typeof error === 'object' && error !== null && 'status' in error
      ? error.status
      : undefined;

  if (typeof status === 'number' && status >= 400 && status <= 599) {
    return {
      ...(httpStates[status] ?? {
        kind: status >= 500 ? 'server' : 'unknown',
        title: status >= 500 ? '服务处理失败' : '请求未完成',
        description: '本次请求未能正常完成，请查看错误详情。',
        hint: '请确认操作信息后重试；若持续出现，可联系管理员。',
      }),
      status,
      code: `HTTP ${status}`,
    };
  }

  if (error instanceof Error && error.name === 'TimeoutError') {
    return {
      kind: 'timeout',
      code: 'REQUEST_TIMEOUT',
      title: '请求超时',
      description: '本次请求未能在规定时间内完成。',
      hint: '请检查网络连接后重试。',
    };
  }

  const message = error instanceof Error ? error.message : '';
  if (
    error instanceof Error &&
    (error.name === 'ChunkLoadError' ||
      /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading (?:CSS )?chunk .+ failed/i.test(
        message,
      ))
  ) {
    return {
      kind: 'resource',
      code: 'RESOURCE_LOAD_FAILED',
      title: '页面资源加载失败',
      description: '页面所需的脚本或样式文件未能加载。',
      hint: '请确认网络正常后重新加载页面，获取最新页面资源。',
    };
  }

  const isNetworkError =
    error instanceof Error &&
    (error.name === 'NetworkError' ||
      message === '网络请求失败' ||
      (error instanceof TypeError &&
        /Failed to fetch|NetworkError when attempting to fetch resource|Load failed/i.test(
          message,
        )));

  if (
    typeof navigator !== 'undefined' &&
    navigator.onLine === false &&
    (context === 'request' || isNetworkError)
  ) {
    return {
      kind: 'offline',
      code: 'OFFLINE',
      title: '网络连接已断开',
      description: '当前设备处于离线状态，暂时无法连接服务。',
      hint: '请恢复网络连接后重试。',
    };
  }

  if (isNetworkError) {
    return {
      kind: 'network',
      code: 'NETWORK_ERROR',
      title: '网络请求失败',
      description: '未能取得服务响应，暂时无法完成请求。',
      hint: '请检查网络或代理连接后重试。',
    };
  }

  return context === 'page'
    ? {
        kind: 'render',
        code: 'PAGE_ERROR',
        title: '页面出现问题',
        description: '页面显示时发生异常，暂时无法正常显示。',
        hint: '可以重试或返回首页；若持续出现，可复制错误详情联系管理员。',
      }
    : {
        kind: 'unknown',
        code: 'REQUEST_ERROR',
        title: '请求未完成',
        description: '本次请求未能正常完成，请查看错误详情。',
        hint: '请确认操作信息后重试；若持续出现，可联系管理员。',
      };
}
