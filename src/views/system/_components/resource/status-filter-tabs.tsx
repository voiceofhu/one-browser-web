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
}

export function ResourceStatusFilterTabs({
  label,
  options,
  value,
  onValueChange,
}: ResourceStatusFilterTabsProps) {
  return (
    <AnimatedSegmentedTabs
      label={label}
      options={options}
      value={value}
      onValueChange={onValueChange}
    />
  )
}
