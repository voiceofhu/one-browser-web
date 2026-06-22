import {
  AnimatedSegmentedTabs,
  type AnimatedSegmentedTabsOption,
} from "@/components/ui/animated-segmented-tabs"
import type { StatusFlag } from "@/types/admin"

export type ResourceStatusFilterValue = "all" | StatusFlag
export type ResourceStatusFilterOption =
  AnimatedSegmentedTabsOption<ResourceStatusFilterValue>

type ResourceStatusFilterTabsProps = {
  label: string
  options: readonly ResourceStatusFilterOption[]
  value: ResourceStatusFilterValue
  onValueChange: (value: ResourceStatusFilterValue) => void
  listClassName?: string
  triggerClassName?: string
  highlightClassName?: string
}

export function ResourceStatusFilterTabs({
  label,
  options,
  value,
  onValueChange,
  listClassName,
  triggerClassName,
  highlightClassName,
}: ResourceStatusFilterTabsProps) {
  return (
    <AnimatedSegmentedTabs
      label={label}
      options={options}
      value={value}
      listClassName={listClassName}
      triggerClassName={triggerClassName}
      highlightClassName={highlightClassName}
      onValueChange={onValueChange}
    />
  )
}
