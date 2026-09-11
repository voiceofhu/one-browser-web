import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/responsive-dialog';
import { DialogActionButton } from '@/components/ui/dialog-action-button';
import { Spinner } from '@/components/ui/spinner';
import type {
  CheckProxyRequest,
  CreateProxyRequest,
  ProxyCheckResult,
  ProxyListItem,
} from '@/features/browser/contracts';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  type BatchImportSummary,
  type BatchProxyCheckState,
  type BatchProxyRow,
  applyCheckStates,
  batchCheckKey,
  batchImportSummaryMessage,
  batchInlineCheckConcurrency,
  hasBatchImportWarning,
  parseBatchRows,
  toCheckProxyRequest,
  toCreateProxyRequest,
} from '../model/proxy-batch-import';
import { formatProxyCheckResult } from '../proxy-check-utils';
import type { EditableProxyType, IpCheckerValue } from '../proxy-form-utils';
import { ProxyBatchImportContent } from './proxy-batch-import-content';

interface ProxyBatchImportDialogProps {
  open: boolean;
  existingProxies: ProxyListItem[];
  isImporting?: boolean;
  onBeforeCheck?: () => boolean | Promise<boolean>;
  onOpenChange: (open: boolean) => void;
  onImport: (
    requests: CreateProxyRequest[],
    checkResults?: Record<string, ProxyCheckResult>,
  ) => Promise<string[]>;
  onCheckProxy: (request: CheckProxyRequest) => Promise<ProxyCheckResult>;
}

export function ProxyBatchImportDialog({
  open,
  existingProxies,
  isImporting,
  onBeforeCheck,
  onOpenChange,
  onImport,
  onCheckProxy,
}: ProxyBatchImportDialogProps) {
  const [rawText, setRawText] = useState('');
  const [defaultType, setDefaultType] = useState<EditableProxyType>('socks5');
  const [ipChecker, setIpChecker] = useState<IpCheckerValue>('ip-api');
  const [checkStates, setCheckStates] = useState<
    Record<string, BatchProxyCheckState>
  >({});
  const rows = useMemo(
    () =>
      parseBatchRows({
        text: rawText,
        defaultType,
        ipChecker,
        existingProxies,
      }),
    [defaultType, existingProxies, ipChecker, rawText],
  );
  const displayRows = useMemo(
    () => applyCheckStates(rows, checkStates),
    [checkStates, rows],
  );
  const validRows = displayRows.filter((row) => row.status === 'valid');
  const uncheckedRows = displayRows.filter(
    (row) => row.canCheck && row.status === 'unchecked',
  );
  const checkableRows = displayRows.filter(
    (row) =>
      row.canCheck && row.status !== 'valid' && row.status !== 'checking',
  );
  const duplicateCount = displayRows.filter(
    (row) => row.status === 'duplicate',
  ).length;
  const invalidCount = displayRows.filter(
    (row) => row.status === 'invalid',
  ).length;
  const checkingCount = displayRows.filter(
    (row) => row.status === 'checking',
  ).length;
  const isChecking = checkingCount > 0;

  function resetForm() {
    setRawText('');
    setDefaultType('socks5');
    setIpChecker('ip-api');
    setCheckStates({});
  }
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  }

  async function saveImportRows(
    finalRows: BatchProxyRow[],
    finalCheckStates: Record<string, BatchProxyCheckState>,
  ) {
    const finalValidRows = finalRows.filter((row) => row.status === 'valid');
    const invalidRows = finalRows.filter((row) => row.status === 'invalid');
    const duplicateRows = finalRows.filter((row) => row.status === 'duplicate');
    let savedProxyIds: string[] = [];
    try {
      if (finalValidRows.length > 0) {
        const checkResults = Object.fromEntries(
          finalValidRows.flatMap((row) => {
            const result = finalCheckStates[batchCheckKey(row)]?.result;
            return result ? [[row.proxyId, result] as const] : [];
          }),
        );
        savedProxyIds = await onImport(
          finalValidRows.map(toCreateProxyRequest),
          checkResults,
        );
      }
    } catch {
      return;
    }

    const summary = {
      validCount: finalValidRows.length,
      invalidCount: invalidRows.length,
      duplicateCount: duplicateRows.length,
      savedCount: savedProxyIds.length,
    } satisfies BatchImportSummary;
    const message = batchImportSummaryMessage(summary);
    if (hasBatchImportWarning(summary)) toast.warning(message);
    else toast.success(message);
    if (!savedProxyIds.length) return;

    const savedIdSet = new Set(savedProxyIds);
    const remainingRows = finalRows.filter(
      (row) => !savedIdSet.has(row.proxyId),
    );
    if (!remainingRows.length) {
      resetForm();
      handleOpenChange(false);
      return;
    }
    const remainingStates: Record<string, BatchProxyCheckState> = {};
    for (const row of remainingRows) {
      const key = batchCheckKey(row);
      const state = finalCheckStates[key];
      if (state) remainingStates[key] = state;
    }
    setRawText(remainingRows.map((row) => row.raw).join('\n'));
    setCheckStates(remainingStates);
  }

  async function importRows() {
    if (!displayRows.length || isChecking || isImporting) return;
    const rowsToCheck = displayRows.filter(
      (row) => row.canCheck && row.status !== 'valid',
    );
    if (rowsToCheck.length > 0) {
      if (onBeforeCheck && !(await onBeforeCheck())) return;
      const nextStates = await runCheckRows(rowsToCheck);
      const finalCheckStates = { ...checkStates, ...nextStates };
      await saveImportRows(
        applyCheckStates(rows, finalCheckStates),
        finalCheckStates,
      );
      return;
    }
    await saveImportRows(displayRows, checkStates);
  }

  async function runCheckRows(rowsToCheck: BatchProxyRow[]) {
    const nextStates: Record<string, BatchProxyCheckState> = {};
    let nextIndex = 0;
    async function worker() {
      while (nextIndex < rowsToCheck.length) {
        const row = rowsToCheck[nextIndex];
        nextIndex += 1;
        if (!row) continue;
        const key = batchCheckKey(row);
        setCheckStates((current) => ({
          ...current,
          [key]: { status: 'checking', message: '正在检测' },
        }));
        let state: BatchProxyCheckState;
        try {
          const result = await onCheckProxy(toCheckProxyRequest(row));
          const passed = result.status === 'ok';
          state = {
            status: passed ? 'valid' : 'invalid',
            message: passed
              ? formatProxyCheckResult(result, '检测通过')
              : result.message || '检测未通过',
            result,
          };
        } catch (error) {
          state = {
            status: 'invalid',
            message: error instanceof Error ? error.message : '检测失败',
          };
        }
        nextStates[key] = state;
        setCheckStates((current) => ({ ...current, [key]: state }));
      }
    }
    const workerCount = Math.min(
      batchInlineCheckConcurrency,
      rowsToCheck.length,
    );
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    return nextStates;
  }

  async function checkRows() {
    if (!checkableRows.length || isChecking || isImporting) return;
    if (onBeforeCheck && !(await onBeforeCheck())) return;
    await runCheckRows(checkableRows);
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="max-h-[min(88vh,39rem)] sm:max-w-3xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="text-base">
            批量新增代理
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="sr-only">
            批量解析并新增可复用代理配置。
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ProxyBatchImportContent
          defaultType={defaultType}
          displayRows={displayRows}
          duplicateCount={duplicateCount}
          invalidCount={invalidCount}
          ipChecker={ipChecker}
          rawText={rawText}
          rowsLength={rows.length}
          setDefaultType={setDefaultType}
          setIpChecker={setIpChecker}
          setRawText={setRawText}
          uncheckedCount={uncheckedRows.length}
          validCount={validRows.length}
        />
        <ResponsiveDialogFooter>
          <DialogActionButton
            action="cancel"
            onClick={() => handleOpenChange(false)}
            disabled={isImporting}
          >
            取消
          </DialogActionButton>
          <DialogActionButton
            action="confirm"
            variant="outline"
            onClick={() => void checkRows()}
            disabled={!checkableRows.length || isChecking || isImporting}
          >
            {isChecking ? <Spinner data-icon="inline-start" /> : null}
            {isChecking ? '检测中' : `检测 ${checkableRows.length} 个代理`}
          </DialogActionButton>
          <DialogActionButton
            onClick={() => void importRows()}
            disabled={!displayRows.length || isChecking || isImporting}
            loading={isChecking || isImporting}
            loadingText={isChecking ? '检测中' : '保存中'}
          >
            保存
          </DialogActionButton>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
