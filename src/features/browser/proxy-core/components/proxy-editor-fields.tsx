import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type {
  OneNodeSocksPort,
  ProxyCheckResult,
} from '@/features/browser/contracts';
import {
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  EyeIcon,
  EyeOffIcon,
  InformationCircleIcon,
  Search01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type {
  ClipboardEventHandler,
  Dispatch,
  ReactNode,
  SetStateAction,
} from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';

import { CountryFlag, resolveCountryCode } from '../../components/country-flag';
import type { ProxyEditorFormValues } from '../model/proxy-editor';
import { formatProxyCheckResult } from '../proxy-check-utils';
import {
  ipCheckerOptions,
  proxyTypes,
  smartParseFormats,
} from '../proxy-form-utils';
import { OneNodeSocksPicker } from './one-node-socks-picker';

export function ProxyEditorFields({
  applySmartParse,
  canCheck,
  checkCurrentProxy,
  form,
  handleHostPaste,
  isChecking,
  latestCheckResult,
  mode,
  onCheck,
  onFormChange,
  onHostChange,
  onPickOneNode,
  parseMessage,
  passwordVisible,
  setPasswordVisible,
}: {
  applySmartParse: (value?: string) => void;
  canCheck: boolean;
  checkCurrentProxy: () => void;
  form: UseFormReturn<ProxyEditorFormValues>;
  handleHostPaste: ClipboardEventHandler<HTMLInputElement>;
  isChecking?: boolean;
  latestCheckResult?: ProxyCheckResult | null;
  mode: 'create' | 'edit';
  onCheck?: unknown;
  onFormChange?: () => void;
  onHostChange: () => void;
  onPickOneNode: (port: OneNodeSocksPort) => void;
  parseMessage: string | null;
  passwordVisible: boolean;
  setPasswordVisible: Dispatch<SetStateAction<boolean>>;
}) {
  const { control } = form;
  return (
    <FieldGroup className="gap-3">
      {parseMessage ? (
        <Alert variant="success">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} />
          <AlertDescription>{parseMessage}</AlertDescription>
        </Alert>
      ) : null}

      <OneNodeSocksPicker onPick={onPickOneNode} />

      <div className="grid gap-3 sm:grid-cols-[8.5rem_1fr]">
        <Controller
          control={control}
          name="type"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>类型</FieldLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  onFormChange?.();
                  field.onChange(value);
                }}
              >
                <SelectTrigger
                  aria-invalid={fieldState.invalid}
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {proxyTypes.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Field
          data-invalid={Boolean(
            form.formState.errors.host || form.formState.errors.port,
          )}
        >
          <div className="flex items-center gap-1">
            <FieldLabel htmlFor="proxy-host">主机 / 端口</FieldLabel>
            <InfoTooltip label="代理地址格式">
              <div className="flex flex-col gap-2">
                <div className="font-medium">支持粘贴完整代理：</div>
                <ul className="ml-4 list-disc">
                  {smartParseFormats.map((item) => (
                    <li key={item} className="break-all">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </InfoTooltip>
          </div>
          <InputGroup className="h-8">
            <Controller
              control={control}
              name="host"
              render={({ field, fieldState }) => (
                <InputGroupInput
                  id="proxy-host"
                  aria-invalid={fieldState.invalid}
                  value={field.value}
                  onBlur={() => {
                    field.onBlur();
                    applySmartParse(field.value);
                  }}
                  onPaste={handleHostPaste}
                  onChange={(event) => {
                    onHostChange();
                    onFormChange?.();
                    field.onChange(event);
                  }}
                  placeholder="主机，支持粘贴完整代理"
                  className="min-w-0"
                />
              )}
            />
            <InputGroupText className="text-muted-foreground/70 px-1">
              :
            </InputGroupText>
            <Controller
              control={control}
              name="port"
              render={({ field, fieldState }) => (
                <InputGroupInput
                  id="proxy-port"
                  aria-invalid={fieldState.invalid}
                  inputMode="numeric"
                  value={field.value}
                  onChange={(event) => {
                    onFormChange?.();
                    field.onChange(event);
                  }}
                  placeholder="端口"
                  className="max-w-24 flex-none text-right tabular-nums"
                />
              )}
            />
          </InputGroup>
          <FieldError
            errors={[form.formState.errors.host, form.formState.errors.port]}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          control={control}
          name="username"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="proxy-username">用户名</FieldLabel>
              <Input
                id="proxy-username"
                aria-invalid={fieldState.invalid}
                value={field.value}
                onChange={(event) => {
                  onFormChange?.();
                  field.onChange(event);
                }}
                placeholder="可选"
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="proxy-password">密码</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="proxy-password"
                  aria-invalid={fieldState.invalid}
                  type={passwordVisible ? 'text' : 'password'}
                  value={field.value}
                  onChange={(event) => {
                    onFormChange?.();
                    field.onChange(event);
                  }}
                  placeholder={mode === 'edit' ? '留空表示不修改' : '可选'}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    aria-label={passwordVisible ? '隐藏密码' : '显示密码'}
                    onClick={() => setPasswordVisible((visible) => !visible)}
                  >
                    <HugeiconsIcon
                      icon={passwordVisible ? EyeOffIcon : EyeIcon}
                      strokeWidth={2}
                    />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </div>

      <Controller
        control={control}
        name="refreshUrl"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <div className="flex items-center gap-1">
              <FieldLabel htmlFor="proxy-refresh-url">换 IP URL</FieldLabel>
              <InfoTooltip label="换 IP URL 说明">
                <div className="flex flex-col gap-1">
                  <div>移动代理的换 IP 链接，可选。</div>
                  <ul className="ml-4 list-disc">
                    <li>手动刷新时会请求这个地址更换出口 IP。</li>
                    <li>共享代理会影响所有使用它的环境。</li>
                    <li>没有该链接时，代理通常不支持主动换 IP。</li>
                  </ul>
                </div>
              </InfoTooltip>
            </div>
            <Input
              id="proxy-refresh-url"
              aria-invalid={fieldState.invalid}
              value={field.value}
              onChange={(event) => {
                onFormChange?.();
                field.onChange(event);
              }}
              placeholder="移动代理换 IP URL，可选"
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        control={control}
        name="remark"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="proxy-remark">备注</FieldLabel>
            <Textarea
              id="proxy-remark"
              aria-invalid={fieldState.invalid}
              value={field.value}
              placeholder="可选"
              maxLength={500}
              onChange={(event) => {
                onFormChange?.();
                field.onChange(event);
              }}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <FieldSeparator />
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Controller
          control={control}
          name="ipChecker"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>IP 检测</FieldLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  onFormChange?.();
                  field.onChange(value);
                }}
              >
                <SelectTrigger
                  aria-invalid={fieldState.invalid}
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {ipCheckerOptions.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            aria-busy={isChecking || undefined}
            disabled={isChecking || !onCheck || !canCheck}
            onClick={checkCurrentProxy}
          >
            {isChecking ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <HugeiconsIcon
                icon={Search01Icon}
                strokeWidth={2}
                data-icon="inline-start"
              />
            )}
            {isChecking ? '检测中' : '检测'}
          </Button>
        </div>
      </div>
      <ProxyCheckFeedback isChecking={isChecking} result={latestCheckResult} />
    </FieldGroup>
  );
}

function InfoTooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={label}
          className="text-muted-foreground -my-1"
        >
          <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="start"
        className="max-w-80 items-start p-3 text-left leading-relaxed"
      >
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

function ProxyCheckFeedback({
  isChecking,
  result,
}: {
  isChecking?: boolean;
  result?: ProxyCheckResult | null;
}) {
  if (isChecking) {
    return (
      <FieldDescription className="flex items-center gap-1.5">
        <Spinner className="size-3.5" />
        正在检测代理出口...
      </FieldDescription>
    );
  }
  if (!result || result.status === 'unchecked') {
    return <FieldDescription>代理尚未检测</FieldDescription>;
  }
  const isOk = result.status === 'ok';
  const countryCode = isOk
    ? resolveCountryCode(result.countryCode, result.country)
    : null;
  return (
    <FieldDescription
      className={
        isOk
          ? 'text-success flex min-w-0 items-center gap-1.5'
          : 'text-destructive flex min-w-0 items-center gap-1.5'
      }
    >
      <HugeiconsIcon
        icon={isOk ? CheckmarkCircle02Icon : AlertCircleIcon}
        strokeWidth={2}
        className="size-3.5 shrink-0"
      />
      {countryCode ? (
        <CountryFlag code={countryCode} country={result.country} />
      ) : null}
      <span className="truncate">{formatProxyCheckResult(result)}</span>
    </FieldDescription>
  );
}
