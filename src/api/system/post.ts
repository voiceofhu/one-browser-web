import { buildQueryPath, http } from "@/lib/request"

import type { ListParams, PageResponse, PostResource } from "@/types/admin"

type PostPayload = Record<string, unknown>

const POST_PATH = "/system/post"

export function listPosts(params?: ListParams) {
  return http.get<PageResponse<PostResource>>(buildQueryPath(POST_PATH, params))
}

export function createPost(payload: PostPayload) {
  return http.post<PostResource>(POST_PATH, payload)
}

export function updatePost(postId: number, payload: PostPayload) {
  return http.put<PostResource>(`${POST_PATH}/${postId}`, payload)
}

export function deletePost(postId: number) {
  return http.del<void>(`${POST_PATH}/${postId}`)
}
