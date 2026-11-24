import { FieldError } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CloudUploadIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useRef } from 'react';
import type { FieldError as HookFormFieldError } from 'react-hook-form';
import { toast } from '@/components/ui/toast';

import { EditorFieldRow } from './editor-controls';

const maxCookieFileBytes = 3 * 1024 * 1024;

export function CookieField({
  error,
  onChange,
  value,
}: {
  error?: HookFormFieldError;
  onChange: (value: string) => void;
  value: string;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const invalid = Boolean(error);

  async function handleFile(file?: File | null) {
    if (!file) {
      return;
    }

    if (file.size > maxCookieFileBytes) {
      toast.error('Cookie 文件不能超过 3 MB');
      return;
    }

    const fileText = await file.text();
    onChange(fileText);
  }

  return (
    <EditorFieldRow label="Cookie">
      <input
        id="profile-editor-cookie-file"
        ref={fileInputRef}
        className="hidden"
        type="file"
        accept=".txt,.json,.cookie"
        onChange={(event) => {
          handleFile(event.target.files?.item(0));
          event.target.value = '';
        }}
      />
      <InputGroup
        className="h-9"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          handleFile(event.dataTransfer.files.item(0));
        }}
      >
        <InputGroupInput
          id="profile-editor-cookie"
          aria-invalid={invalid}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="支持格式：JSON、Netscape、Name=Value"
          title={value}
        />
        <InputGroupAddon align="inline-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <InputGroupButton
                aria-label="上传 Cookie"
                size="icon-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <HugeiconsIcon icon={CloudUploadIcon} strokeWidth={2} />
              </InputGroupButton>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              align="end"
              className="max-w-72 items-start p-3 text-left leading-relaxed"
            >
              支持 JSON 数组/对象、Netscape Cookie 文件、Name=Value；单文件最大
              3 MB。
            </TooltipContent>
          </Tooltip>
        </InputGroupAddon>
      </InputGroup>
      {error ? (
        <div className="mt-1 text-xs">
          <FieldError errors={[error]} />
        </div>
      ) : null}
    </EditorFieldRow>
  );
}
