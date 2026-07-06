"use client"

import * as React from "react"
import NiceAvatar, { genConfig } from "react-nice-avatar"

import { normalizeDefaultUserAvatarSeed } from "@/lib/default-user-avatar"
import { cn } from "@/lib/utils"

export function DefaultUserAvatar({
  className,
  seed,
}: {
  className?: string
  seed: string
}) {
  const config = React.useMemo(
    () => genConfig(normalizeDefaultUserAvatarSeed(seed)),
    [seed]
  )

  return (
    <NiceAvatar
      className={cn("size-full", className)}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "inherit",
      }}
      {...config}
    />
  )
}
