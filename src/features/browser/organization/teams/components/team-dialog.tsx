import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/responsive-dialog';
import { DialogActionButton } from '@/components/ui/dialog-action-button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import * as React from 'react';
import { toast } from '@/components/ui/toast';

import { generatedKey } from '../team-scope';
import type { RemoteTeamPayload, RemoteTeamResource } from '../types';

export function TeamDialog({
  open,
  mode = 'create',
  record,
  isSaving,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  mode?: 'create' | 'edit';
  record?: RemoteTeamResource | null;
  isSaving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: RemoteTeamPayload) => void;
}) {
  const formId = 'remote-team-form';
  const isEdit = mode === 'edit' && Boolean(record);
  const teamKey = record?.team_key ?? generatedKey('team');

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const teamName = textValue(formData, 'team_name');
    const submittedTeamKey = isEdit
      ? teamKey
      : textValue(formData, 'team_key') || generatedKey('team');

    if (!teamName) {
      toast.error('团队名称必填');
      return;
    }

    onSubmit({
      team_key: submittedTeamKey,
      team_name: teamName,
      status: isEdit
        ? ((textValue(formData, 'status') || '0') as '0' | '1')
        : '0',
      remark: textValue(formData, 'remark'),
    });
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-xl">
        <form
          id={formId}
          key={isEdit ? `edit-${record?.team_id}` : 'create'}
          onSubmit={submit}
        >
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {isEdit ? '重命名团队' : '新增团队'}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {isEdit
                ? '更新团队名称、状态和备注。'
                : '新团队会把当前账号设为 owner。'}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody>
            <FieldGroup className="gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <RequiredFieldLabel htmlFor="team-name">
                    团队名称
                  </RequiredFieldLabel>
                  <Input
                    id="team-name"
                    name="team_name"
                    defaultValue={record?.team_name}
                    disabled={isSaving}
                    required
                  />
                </Field>
                <Field>
                  <RequiredFieldLabel htmlFor="team-key">
                    团队标识
                  </RequiredFieldLabel>
                  <Input
                    id="team-key"
                    name="team_key"
                    defaultValue={teamKey}
                    disabled={isSaving || isEdit}
                    required
                  />
                </Field>
                {isEdit ? (
                  <Field>
                    <FieldLabel htmlFor="team-status">状态</FieldLabel>
                    <NativeSelect
                      id="team-status"
                      name="status"
                      className="w-full"
                      defaultValue={record?.status ?? '0'}
                      disabled={isSaving}
                    >
                      <NativeSelectOption value="0">启用</NativeSelectOption>
                      <NativeSelectOption value="1">停用</NativeSelectOption>
                    </NativeSelect>
                  </Field>
                ) : null}
              </div>
              <Field>
                <FieldLabel htmlFor="team-remark">备注</FieldLabel>
                <Textarea
                  id="team-remark"
                  name="remark"
                  defaultValue={record?.remark}
                  disabled={isSaving}
                />
              </Field>
            </FieldGroup>
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <DialogActionButton
              action="cancel"
              type="button"
              disabled={isSaving}
              onClick={() => onOpenChange(false)}
            >
              取消
            </DialogActionButton>
            <DialogActionButton
              type="submit"
              form={formId}
              disabled={isSaving}
              loading={isSaving}
              loadingText="保存中..."
            >
              保存
            </DialogActionButton>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function RequiredFieldLabel({
  children,
  ...props
}: React.ComponentProps<typeof FieldLabel>) {
  return (
    <FieldLabel {...props}>
      {children}
      <span className="text-destructive" aria-hidden="true">
        *
      </span>
      <span className="sr-only">必填</span>
    </FieldLabel>
  );
}

function textValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}
