"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { DashboardResourceConfig } from "./configs"
import {
  showResourceError,
  showResourceReorderSuccess,
} from "./toast"

export function useResourceReorder<TData, TDetail extends TData = TData>(
  config: DashboardResourceConfig<TData, TDetail>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      payload: Parameters<NonNullable<typeof config.reorder>>[0]
    ) => {
      if (!config.reorder) {
        throw new Error("当前资源不支持拖拽排序")
      }

      return config.reorder(payload)
    },
    onSuccess: async (count) => {
      await queryClient.invalidateQueries({ queryKey: config.queryKey })
      showResourceReorderSuccess(config.noun, count)
    },
    onError: showResourceError,
  })
}
