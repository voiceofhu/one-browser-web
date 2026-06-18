"use client"

import * as React from "react"
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  SearchIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  filterMenuIconOptions,
  getMenuIconOption,
  MENU_ICON_CATEGORIES,
  type MenuIconCategoryValue,
} from "./menu-icons"

type MenuIconSelectProps = {
  controlId: string
  value: unknown
  invalid: boolean
  disabled: boolean
  onChange: (icon: string) => void
}

const PAGE_SIZE = 40

export function MenuIconSelect({
  controlId,
  value,
  invalid,
  disabled,
  onChange,
}: MenuIconSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [keyword, setKeyword] = React.useState("")
  const [category, setCategory] = React.useState<MenuIconCategoryValue>("all")
  const [page, setPage] = React.useState(1)
  const iconValue = typeof value === "string" && value ? value : "#"
  const selectedOption = getMenuIconOption(iconValue)
  const filteredOptions = React.useMemo(
    () => filterMenuIconOptions(keyword, category),
    [category, keyword]
  )
  const totalPages = Math.max(1, Math.ceil(filteredOptions.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageStart = (safePage - 1) * PAGE_SIZE
  const pageEnd = pageStart + PAGE_SIZE
  const pagedOptions = filteredOptions.slice(pageStart, pageEnd)
  const visibleStart = filteredOptions.length === 0 ? 0 : pageStart + 1
  const visibleEnd = Math.min(pageEnd, filteredOptions.length)

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)

    if (!nextOpen) {
      setKeyword("")
      setCategory("all")
      setPage(1)
    }
  }

  function selectIcon(nextValue: string) {
    onChange(nextValue)
    handleOpenChange(false)
  }

  function goToPage(nextPage: number) {
    setPage(Math.min(Math.max(nextPage, 1), totalPages))
  }

  function handleKeywordChange(nextKeyword: string) {
    setKeyword(nextKeyword)
    setPage(1)
  }

  function handleCategoryChange(nextCategory: string) {
    setCategory(nextCategory as MenuIconCategoryValue)
    setPage(1)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          id={controlId}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={invalid}
          aria-expanded={open}
          className="h-8 w-full justify-between px-2.5 font-normal"
        >
          <span className="flex min-w-0 items-center gap-2">
            <MenuIconPreview value={selectedOption.value} />
            <span className="truncate">{selectedOption.label}</span>
          </span>
          <ChevronsUpDownIcon data-icon="inline-end" />
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-3 p-3 sm:max-w-4xl">
        <DialogHeader className="gap-1 pr-8">
          <DialogTitle className="text-base">选择菜单图标</DialogTitle>
          <DialogDescription className="text-xs">
            当前：{selectedOption.label}（{selectedOption.value}）
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2.5">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              placeholder="搜索图标名称或标识"
              className="h-8 pl-8"
              onChange={(event) => handleKeywordChange(event.target.value)}
            />
          </div>

          <Tabs value={category} onValueChange={handleCategoryChange}>
            <div className="overflow-x-auto">
              <TabsList className="h-7">
                {MENU_ICON_CATEGORIES.map((item) => (
                  <TabsTrigger
                    key={item.value}
                    value={item.value}
                    className="px-2 text-xs"
                  >
                    {item.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>

          {pagedOptions.length > 0 ? (
            <div className="grid max-h-[52vh] grid-cols-2 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6">
              {pagedOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={iconValue === option.value ? "secondary" : "outline"}
                  className={cn(
                    "h-10 justify-start gap-1.5 px-2 font-normal",
                    iconValue !== option.value && "bg-background"
                  )}
                  onClick={() => selectIcon(option.value)}
                >
                  <option.Icon />
                  <span className="flex min-w-0 flex-1 flex-col items-start">
                    <span className="max-w-full truncate text-sm leading-tight">
                      {option.label}
                    </span>
                    <span className="max-w-full truncate text-xs leading-tight text-muted-foreground">
                      {option.value}
                    </span>
                  </span>
                  {iconValue === option.value ? (
                    <CheckIcon className="text-primary" />
                  ) : null}
                </Button>
              ))}
            </div>
          ) : (
            <Empty className="min-h-56 border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchIcon />
                </EmptyMedia>
                <EmptyTitle>没有匹配的图标</EmptyTitle>
                <EmptyDescription>换一个关键词或分类试试。</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}

          <div className="flex flex-col gap-2 border-t pt-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              当前显示 {visibleStart}-{visibleEnd} 个，共{" "}
              {filteredOptions.length} 个
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={safePage <= 1}
                onClick={() => goToPage(safePage - 1)}
              >
                <ChevronLeftIcon data-icon="inline-start" />
                上一页
              </Button>
              <span className="min-w-12 text-center text-xs text-muted-foreground">
                {safePage} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={safePage >= totalPages}
                onClick={() => goToPage(safePage + 1)}
              >
                下一页
                <ChevronRightIcon data-icon="inline-end" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function MenuIconPreview({ value }: { value: string }) {
  const option = getMenuIconOption(value)

  return <option.Icon aria-hidden="true" />
}
