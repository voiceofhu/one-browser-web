"use client"

import { useEffect, useLayoutEffect, useRef, type PointerEvent } from "react"
import { gsap } from "gsap"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleXIcon,
  MaximizeIcon,
  RefreshCwIcon,
  XIcon,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTranslation } from "@/components/providers/language-context"
import { routeIcons } from "@/layout/components/route-icons"
import { cn } from "@/lib/utils"
import {
  DEFAULT_APP_ROUTE,
  type AppRouteId,
  type AppRouteMeta,
} from "@/router/routes"

type TagsViewProps = {
  activeRoute: AppRouteId
  isRefreshing?: boolean
  tags: AppRouteMeta[]
  onCloseAll: () => void
  onCloseCurrent: () => void
  onCloseLeft: () => void
  onCloseOthers: () => void
  onCloseRight: () => void
  onCloseTag: (route: AppRouteMeta) => void
  onRefresh: () => void
  onSelectTag: (route: AppRouteMeta) => void
}

const SCROLL_OFFSET = 240

export function TagsView({
  activeRoute,
  isRefreshing = false,
  tags,
  onCloseAll,
  onCloseCurrent,
  onCloseLeft,
  onCloseOthers,
  onCloseRight,
  onCloseTag,
  onRefresh,
  onSelectTag,
}: TagsViewProps) {
  const { t } = useTranslation()
  const rootRef = useRef<HTMLDivElement>(null)
  const refreshIconRef = useRef<SVGSVGElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const previousTagCountRef = useRef(tags.length)
  const activeIndex = tags.findIndex((tag) => tag.id === activeRoute)
  const canCloseCurrent = activeRoute !== DEFAULT_APP_ROUTE
  const canCloseLeft = tags.some(
    (tag, index) => tag.id !== DEFAULT_APP_ROUTE && index < activeIndex
  )
  const canCloseRight = tags.some(
    (tag, index) => tag.id !== DEFAULT_APP_ROUTE && index > activeIndex
  )
  const canCloseOthers = tags.some(
    (tag) => tag.id !== DEFAULT_APP_ROUTE && tag.id !== activeRoute
  )
  const canCloseAll = tags.some((tag) => tag.id !== DEFAULT_APP_ROUTE)
  const showTagActions = tags.length !== 1 || tags[0]?.id !== DEFAULT_APP_ROUTE
  const isFirstTagActive = tags[0]?.id === activeRoute

  function syncActiveCloseButton(root: HTMLElement) {
    const activeCloseButton = root.querySelector<HTMLElement>(
      `[data-active-tag="true"].is-closable .tags-view-chrome__close`
    )
    if (!activeCloseButton) {
      return
    }

    gsap.killTweensOf(activeCloseButton)
    gsap.set(activeCloseButton, { clearProps: "all" })
  }

  function animateCloseButton(container: HTMLElement, visible: boolean) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }

    const shouldShow = visible || container.dataset.activeTag === "true"
    const closeButton = container.querySelector<HTMLElement>(
      ".tags-view-chrome__close"
    )
    if (!closeButton) {
      return
    }

    gsap.killTweensOf(closeButton)
    gsap.to(closeButton, {
      autoAlpha: shouldShow ? 0.68 : 0,
      duration: shouldShow ? 0.16 : 0.12,
      ease: shouldShow ? "power2.out" : "power2.inOut",
      marginLeft: shouldShow ? 3 : 0,
      scale: shouldShow ? 1 : 0.72,
      width: shouldShow ? 16 : 0,
      onStart: () => {
        if (shouldShow) {
          closeButton.style.pointerEvents = "auto"
        }
      },
      onComplete: () => {
        if (!shouldShow) {
          closeButton.style.pointerEvents = "none"
        }
      },
    })
  }

  function showCloseButton(event: PointerEvent<HTMLDivElement>) {
    animateCloseButton(event.currentTarget, true)
  }

  function hideCloseButton(event: PointerEvent<HTMLDivElement>) {
    animateCloseButton(event.currentTarget, false)
  }

  useEffect(() => {
    const activeElement = scrollRef.current?.querySelector<HTMLElement>(
      `[data-active-tag="true"]`
    )
    activeElement?.scrollIntoView({ block: "nearest", inline: "center" })
  }, [activeRoute, tags])

  useLayoutEffect(() => {
    const root = rootRef.current
    const scroll = scrollRef.current
    if (!root || !scroll) {
      return
    }

    let animationFrame = 0
    const updateOverflow = () => {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = window.requestAnimationFrame(() => {
        const hasOverflow = scroll.scrollWidth > scroll.clientWidth + 1
        root.dataset.overflow = hasOverflow ? "true" : "false"
      })
    }

    updateOverflow()
    window.addEventListener("resize", updateOverflow)

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updateOverflow)
    resizeObserver?.observe(scroll)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener("resize", updateOverflow)
      resizeObserver?.disconnect()
    }
  }, [tags.length])

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) {
      previousTagCountRef.current = tags.length
      return
    }

    syncActiveCloseButton(root)

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      previousTagCountRef.current = tags.length
      return
    }

    const activeElement = root.querySelector<HTMLElement>(
      `[data-active-tag="true"]`
    )
    const ctx = gsap.context(() => {
      if (tags.length > previousTagCountRef.current) {
        const newestTag = root.querySelector<HTMLElement>(
          `[data-tag-id="${tags[tags.length - 1]?.id}"]`
        )
        if (newestTag) {
          gsap.fromTo(
            newestTag,
            { autoAlpha: 0, scale: 0.96, x: 8, y: 2 },
            {
              autoAlpha: 1,
              duration: 0.24,
              ease: "power3.out",
              scale: 1,
              x: 0,
              y: 0,
            }
          )
        }
      }

      if (activeElement) {
        const activeLabel = activeElement.querySelector<HTMLElement>(
          ".tags-view-chrome__label"
        )
        gsap.fromTo(
          activeElement,
          { scale: 0.985, y: 1 },
          { duration: 0.18, ease: "power3.out", scale: 1, y: 0 }
        )
        if (activeLabel) {
          gsap.fromTo(
            activeLabel,
            { autoAlpha: 0.78, y: 1 },
            { autoAlpha: 1, duration: 0.2, ease: "power2.out", y: 0 }
          )
        }
      }
    }, root)

    previousTagCountRef.current = tags.length
    return () => ctx.revert()
  }, [activeRoute, tags])

  useLayoutEffect(() => {
    if (!isRefreshing || !refreshIconRef.current) {
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        refreshIconRef.current,
        { rotate: 0 },
        { rotate: 360, duration: 0.55, ease: "power2.out" }
      )
    }, rootRef)

    return () => ctx.revert()
  }, [isRefreshing])

  function scrollBy(offset: number) {
    scrollRef.current?.scrollBy({ left: offset, behavior: "smooth" })
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
      return
    }

    void document.documentElement.requestFullscreen()
  }

  return (
    <div ref={rootRef} className="tags-view-chrome">
      <button
        type="button"
        className="tags-view-chrome__nav tags-view-chrome__nav--left"
        aria-label={t("tags.scrollLeft")}
        onClick={() => scrollBy(-SCROLL_OFFSET)}
      >
        <ChevronLeftIcon />
      </button>
      <div ref={scrollRef} className="tags-view-chrome__wrapper">
        <div
          className={cn(
            "tags-view-chrome__list",
            isFirstTagActive && "is-first-active"
          )}
        >
          {tags.map((tag, index) => {
            const active = tag.id === activeRoute
            const closable = tag.id !== DEFAULT_APP_ROUTE
            const title = t(tag.labelKey)
            const previousTag = tags[index - 1]
            const separated =
              index > 0 && !active && previousTag?.id !== activeRoute

            return (
              <div
                key={tag.id}
                data-tag-id={tag.id}
                data-active-tag={active}
                onPointerEnter={active ? undefined : showCloseButton}
                onPointerLeave={active ? undefined : hideCloseButton}
                className={cn(
                  "tags-view-chrome__item",
                  active && "active",
                  closable && "is-closable",
                  separated && "is-separated"
                )}
              >
                <button
                  type="button"
                  className="tags-view-chrome__label"
                  onClick={() => onSelectTag(tag)}
                >
                  <span className="tags-view-chrome__icon">
                    {routeIcons[tag.id]}
                  </span>
                  <span>{title}</span>
                </button>
                {closable ? (
                  <button
                    type="button"
                    className="tags-view-chrome__close"
                    tabIndex={-1}
                    aria-label={t("tags.close", { title })}
                    onClick={() => onCloseTag(tag)}
                  >
                    <XIcon />
                  </button>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
      <button
        type="button"
        className="tags-view-chrome__nav tags-view-chrome__nav--right"
        aria-label={t("tags.scrollRight")}
        onClick={() => scrollBy(SCROLL_OFFSET)}
      >
        <ChevronRightIcon />
      </button>
      {showTagActions ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="tags-view-chrome__action"
              aria-label={t("tags.actions")}
            >
              <ChevronDownIcon />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuGroup>
              <DropdownMenuItem
                disabled={!canCloseCurrent}
                onSelect={onCloseCurrent}
              >
                <XIcon />
                {t("tags.closeCurrent")}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!canCloseOthers}
                onSelect={onCloseOthers}
              >
                <CircleXIcon />
                {t("tags.closeOthers")}
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!canCloseLeft} onSelect={onCloseLeft}>
                <ArrowLeftIcon />
                {t("tags.closeLeft")}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!canCloseRight}
                onSelect={onCloseRight}
              >
                <ArrowRightIcon />
                {t("tags.closeRight")}
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!canCloseAll} onSelect={onCloseAll}>
                <CircleXIcon />
                {t("tags.closeAll")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={toggleFullscreen}>
              <MaximizeIcon />
              {t("tags.fullscreen")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
      {showTagActions ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="tags-view-chrome__action tags-view-chrome__refresh"
              aria-label={t("tags.refreshCurrent")}
              onClick={onRefresh}
            >
              <RefreshCwIcon ref={refreshIconRef} />
            </button>
          </TooltipTrigger>
          <TooltipContent>{t("tags.refreshCurrent")}</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  )
}
