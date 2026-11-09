import { CopyButton } from '@/components/ui/copy-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export function CodeBlock({
  code,
  label,
  className,
}: {
  code: string;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'bg-muted/40 group relative min-w-0 overflow-hidden rounded-lg border',
        className,
      )}
    >
      <div className="flex h-9 items-center justify-between border-b px-3">
        <span className="text-muted-foreground font-mono text-[11px]">
          {label}
        </span>
        <CopyButton
          text={code}
          variant="ghost"
          size="sm"
          className="text-muted-foreground h-7 px-2 text-xs"
          showToast={false}
        />
      </div>
      <pre className="overflow-x-auto p-4 text-[12.5px] leading-6">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}

export type CodeSample = {
  id: string;
  label: string;
  file: string;
  code: string;
};

export function CodeTabs({ samples }: { samples: readonly CodeSample[] }) {
  return (
    <Tabs defaultValue={samples[0]?.id} className="min-w-0 gap-3">
      <TabsList className="max-w-full overflow-x-auto">
        {samples.map((sample) => (
          <TabsTrigger key={sample.id} value={sample.id} className="text-xs">
            {sample.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {samples.map((sample) => (
        <TabsContent key={sample.id} value={sample.id} className="min-w-0">
          <CodeBlock code={sample.code} label={sample.file} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
