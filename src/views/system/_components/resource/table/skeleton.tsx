import { Skeleton } from "@/components/ui/skeleton"

export function ResourceTableSkeleton({ columns }: { columns: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 6 }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(7rem, 1fr))`,
          }}
        >
          {Array.from({ length: columns }).map((__, cellIndex) => (
            <Skeleton key={cellIndex} className="h-7" />
          ))}
        </div>
      ))}
    </div>
  )
}
