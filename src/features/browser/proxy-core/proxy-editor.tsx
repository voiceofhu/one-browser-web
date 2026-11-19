import type {
  CheckProxyRequest,
  CreateProxyRequest,
  OneNodeSocksPort,
  ProxyCheckResult,
  ProxyConfig,
  UpdateProxyRequest,
} from '@/features/browser/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { type ClipboardEvent, useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { ProxyEditorFields } from './components/proxy-editor-fields';
import {
  type ProxyEditorFormValues,
  defaultProxyEditorFormValues,
  proxyEditorSchema,
} from './model/proxy-editor';
import {
  createProxyId,
  ipCheckerUrl,
  nullableText,
  numberValue,
  parseHostPortInput,
  proxyName,
} from './proxy-form-utils';

export type ProxyEditorSubmitValue = CreateProxyRequest | UpdateProxyRequest;

function nullablePassword(value: string) {
  return value.length > 0 ? value : null;
}

interface ProxyEditorProps {
  mode: 'create' | 'edit';
  formId: string;
  proxy?: ProxyConfig | null;
  checkResult?: ProxyCheckResult | null;
  isChecking?: boolean;
  passwordVisibleByDefault?: boolean;
  onCheck?: (value: CheckProxyRequest) => void;
  onFormChange?: () => void;
  onSubmit: (value: ProxyEditorSubmitValue) => void;
}

export function ProxyEditor({
  mode,
  formId,
  proxy,
  checkResult,
  isChecking,
  passwordVisibleByDefault = false,
  onCheck,
  onFormChange,
  onSubmit,
}: ProxyEditorProps) {
  const [generatedProxyId] = useState(createProxyId);
  const proxyId = proxy?.proxyId ?? generatedProxyId;
  const [passwordVisible, setPasswordVisible] = useState(
    passwordVisibleByDefault,
  );
  const [parseNotice, setParseNotice] = useState<{
    host: string;
    message: string;
  } | null>(null);
  const form = useForm<ProxyEditorFormValues>({
    resolver: zodResolver(proxyEditorSchema),
    defaultValues: defaultProxyEditorFormValues(proxy),
  });
  const { control, getValues, handleSubmit, reset, setValue } = form;
  const [hostValue = '', portValue = ''] = useWatch({
    control,
    name: ['host', 'port'],
  });
  const latestCheckResult = checkResult ?? proxy?.lastCheck;
  const parsedCheckInput = parseHostPortInput(hostValue);
  const parseMessage =
    parseNotice?.host === hostValue ? parseNotice.message : null;
  const canCheck = Boolean(
    nullableText(parsedCheckInput?.host ?? hostValue) &&
    numberValue(parsedCheckInput?.port ?? portValue),
  );

  useEffect(() => {
    reset(defaultProxyEditorFormValues(proxy));
  }, [proxy, reset]);

  function applyParsedProxy(
    parsed: NonNullable<ReturnType<typeof parseHostPortInput>>,
    options?: { notify?: boolean },
  ) {
    if (parsed.type) {
      setValue('type', parsed.type, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    if (parsed.host) {
      setValue('host', parsed.host, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    if (parsed.port) {
      setValue('port', parsed.port, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    if (parsed.username) {
      setValue('username', parsed.username, { shouldDirty: true });
    }
    if (parsed.password) {
      setValue('password', parsed.password, { shouldDirty: true });
    }
    if (parsed.refreshUrl) {
      setValue('refreshUrl', parsed.refreshUrl, { shouldDirty: true });
    }
    if (options?.notify) {
      setParseNotice({
        host: parsed.host,
        message: '解析成功，请确认代理信息。',
      });
    }
  }

  function applySmartParse(value = getValues('host')) {
    const parsed = parseHostPortInput(value);
    if (parsed) applyParsedProxy(parsed);
  }

  function handleHostPaste(event: ClipboardEvent<HTMLInputElement>) {
    const parsed = parseHostPortInput(event.clipboardData.getData('text'));
    if (!parsed) return;
    event.preventDefault();
    onFormChange?.();
    applyParsedProxy(parsed, { notify: true });
  }

  function applyOneNodePort(port: OneNodeSocksPort) {
    const options = { shouldDirty: true, shouldValidate: true };
    onFormChange?.();
    setParseNotice(null);
    setValue('type', 'socks5', options);
    setValue('host', port.host, options);
    setValue('port', String(port.port), options);
    setValue('username', '', { shouldDirty: true });
    setValue('password', '', { shouldDirty: true });
    if (!getValues('remark').trim()) {
      setValue('remark', `One Node · ${port.name}`, options);
    }
  }

  function checkCurrentProxy() {
    const values = getValues();
    const parsed = parseHostPortInput(values.host);
    const nextType = parsed?.type ?? values.type;
    const nextHost = parsed?.host ?? values.host;
    const nextPort = parsed?.port ?? values.port;
    const nextUsername = parsed?.username ?? values.username;
    const nextPassword = parsed?.password ?? values.password;
    if (parsed?.type) {
      setValue('type', parsed.type, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    if (parsed?.host) {
      setValue('host', parsed.host, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    if (parsed?.port) {
      setValue('port', parsed.port, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    if (parsed?.username) {
      setValue('username', parsed.username, { shouldDirty: true });
    }
    if (parsed?.password) {
      setValue('password', parsed.password, { shouldDirty: true });
    }
    if (parsed?.refreshUrl) {
      setValue('refreshUrl', parsed.refreshUrl, { shouldDirty: true });
    }
    onCheck?.({
      proxyConfig: {
        type: nextType,
        host: nullableText(nextHost),
        port: numberValue(nextPort),
        username: nullableText(nextUsername),
        password: nullablePassword(nextPassword) ?? proxy?.password ?? null,
        server: null,
        pacUrl: null,
        bypassList: [],
      },
      ipChecker: ipCheckerUrl(values.ipChecker),
    });
  }

  function submit(values: ProxyEditorFormValues) {
    const payload = {
      proxyId,
      name: proxyName(values.type, values.host, values.port, proxyId),
      type: values.type,
      host: nullableText(values.host),
      port: numberValue(values.port),
      username: nullableText(values.username),
      server: null,
      pacUrl: null,
      bypassList: [],
      refreshUrl: nullableText(values.refreshUrl),
      ipChecker: ipCheckerUrl(values.ipChecker),
      remark: values.remark.trim(),
    } satisfies CreateProxyRequest;
    const passwordChanged = values.password !== (proxy?.password ?? '');
    onSubmit(
      mode === 'edit' && !passwordChanged
        ? payload
        : { ...payload, password: nullablePassword(values.password) },
    );
  }

  return (
    <form id={formId} onSubmit={handleSubmit(submit)}>
      <ProxyEditorFields
        applySmartParse={applySmartParse}
        canCheck={canCheck}
        checkCurrentProxy={checkCurrentProxy}
        form={form}
        handleHostPaste={handleHostPaste}
        isChecking={isChecking}
        latestCheckResult={latestCheckResult}
        mode={mode}
        onCheck={onCheck}
        onFormChange={onFormChange}
        onHostChange={() => setParseNotice(null)}
        onPickOneNode={applyOneNodePort}
        parseMessage={parseMessage}
        passwordVisible={passwordVisible}
        setPasswordVisible={setPasswordVisible}
      />
    </form>
  );
}
