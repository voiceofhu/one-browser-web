import { buildQueryPath, http } from "@/lib/request"

import type {
  ListParams,
  NoticeSummaryResource,
  NoticeResource,
  PageResponse,
  ResourceMutationResult,
  StatusFlag,
} from "@/types/admin"

type NoticePayload = Record<string, unknown>

const NOTICE_PATH = "/system/notices"

export function listNotices(params?: ListParams) {
  return http.get<PageResponse<NoticeSummaryResource>>(
    buildQueryPath(NOTICE_PATH, params)
  )
}

export function createNotice(payload: NoticePayload) {
  return http.post<ResourceMutationResult>(NOTICE_PATH, payload)
}

export function getNotice(noticeId: number) {
  return http.get<NoticeResource>(`${NOTICE_PATH}/${noticeId}`)
}

export function updateNotice(noticeId: number, payload: NoticePayload) {
  return http.put<NoticeResource>(`${NOTICE_PATH}/${noticeId}`, payload)
}

export function setNoticeStatus(
  notice: NoticeSummaryResource,
  status: StatusFlag
) {
  return http.put<NoticeResource>(`${NOTICE_PATH}/${notice.notice_id}/status`, {
    status,
  })
}

export function deleteNotice(noticeId: number) {
  return http.del<void>(`${NOTICE_PATH}/${noticeId}`)
}
