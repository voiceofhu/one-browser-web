import { buildQueryPath, http } from "@/lib/request"

import type {
  JobListParams,
  JobLogResource,
  JobPayload,
  JobResource,
  PageResponse,
  ResourceMutationResult,
  StatusFlag,
} from "@/types/admin"

const JOBS_PATH = "/system/monitor/jobs"
const JOB_LOGS_PATH = "/system/monitor/job-logs"

export function listJobs(params?: JobListParams) {
  return http.get<PageResponse<JobResource>>(buildQueryPath(JOBS_PATH, params))
}

export function getJob(jobId: number) {
  return http.get<JobResource>(`${JOBS_PATH}/${jobId}`)
}

export function createJob(payload: JobPayload) {
  return http.post<ResourceMutationResult>(JOBS_PATH, payload)
}

export function updateJob(jobId: number, payload: JobPayload) {
  return http.put<JobResource>(`${JOBS_PATH}/${jobId}`, payload)
}

export function updateJobStatus(jobId: number, status: StatusFlag) {
  return http.patch<JobResource>(`${JOBS_PATH}/${jobId}/status`, { status })
}

export function deleteJob(jobId: number) {
  return http.del<void>(`${JOBS_PATH}/${jobId}`)
}

export function runJobOnce(jobId: number) {
  return http.post<ResourceMutationResult>(`${JOBS_PATH}/${jobId}/runs`)
}

export function listJobLogs(params?: JobListParams) {
  return http.get<PageResponse<JobLogResource>>(
    buildQueryPath(JOB_LOGS_PATH, params)
  )
}
