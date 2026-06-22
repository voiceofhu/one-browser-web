import { buildQueryPath, http } from "@/lib/request"

import type {
  ListParams,
  PageResponse,
  PostResource,
  ResourceMutationResult,
  StatusFlag,
} from "@/types/admin"

type PostPayload = Record<string, unknown>

const POST_PATH = "/system/posts"

export function listPosts(params?: ListParams) {
  return http.get<PageResponse<PostResource>>(buildQueryPath(POST_PATH, params))
}

export function getPost(postId: number) {
  return http.get<PostResource>(`${POST_PATH}/${postId}`)
}

export function createPost(payload: PostPayload) {
  return http.post<ResourceMutationResult>(POST_PATH, payload)
}

export function updatePost(postId: number, payload: PostPayload) {
  return http.put<PostResource>(`${POST_PATH}/${postId}`, payload)
}

export function setPostStatus(post: PostResource, status: StatusFlag) {
  return updatePost(post.post_id, {
    post_name: post.post_name,
    status,
    remark: post.remark,
  })
}

export function deletePost(postId: number) {
  return http.del<void>(`${POST_PATH}/${postId}`)
}
