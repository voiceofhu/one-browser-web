import { atom } from "jotai"
import { atomWithStorage, createJSONStorage } from "jotai/utils"

import {
  APP_ROUTE_BY_ID,
  DEFAULT_APP_ROUTE,
  type AppRouteId,
} from "@/router/routes"

type TagIdsUpdate =
  | AppRouteId[]
  | ((currentTagIds: AppRouteId[]) => AppRouteId[])

type StringStorage = {
  getItem: (key: string) => string | null
  removeItem: (key: string) => void
  setItem: (key: string, value: string) => void
}

const STORAGE_KEY = "one-browser:layout:visited-tags"
const DEFAULT_TAG_IDS: AppRouteId[] = [DEFAULT_APP_ROUTE]
const FALLBACK_STORAGE: StringStorage = {
  getItem: () => null,
  removeItem: () => undefined,
  setItem: () => undefined,
}

function getSessionStorage(): StringStorage {
  try {
    return window.sessionStorage
  } catch {
    return FALLBACK_STORAGE
  }
}

function isAppRouteId(value: unknown): value is AppRouteId {
  return typeof value === "string" && value in APP_ROUTE_BY_ID
}

export function normalizeVisitedTagIds(
  tagIds: readonly unknown[] | null | undefined
) {
  const normalized: AppRouteId[] = [DEFAULT_APP_ROUTE]

  for (const tagId of tagIds ?? []) {
    if (
      isAppRouteId(tagId) &&
      tagId !== DEFAULT_APP_ROUTE &&
      !normalized.includes(tagId)
    ) {
      normalized.push(tagId)
    }
  }

  return normalized
}

const storedVisitedTagIdsAtom = atomWithStorage<AppRouteId[]>(
  STORAGE_KEY,
  DEFAULT_TAG_IDS,
  createJSONStorage<AppRouteId[]>(getSessionStorage),
  { getOnInit: true }
)

export const visitedTagIdsAtom = atom(
  (get) => normalizeVisitedTagIds(get(storedVisitedTagIdsAtom)),
  (get, set, update: TagIdsUpdate) => {
    const currentTagIds = normalizeVisitedTagIds(get(storedVisitedTagIdsAtom))
    const nextTagIds =
      typeof update === "function" ? update(currentTagIds) : update

    set(storedVisitedTagIdsAtom, normalizeVisitedTagIds(nextTagIds))
  }
)
