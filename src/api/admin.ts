import request from '@/utils/request'
import type { CacheStatusVO, JobConfigVO, CatalogCacheMetaVO } from '@/types'

export const getCacheStatus = () => {
  return request.get<any, CacheStatusVO[]>('/admin/cache/status')
}

export const refreshCache = (cacheType: string) => {
  return request.post<any, { message?: string; meta?: CatalogCacheMetaVO }>(`/admin/cache/refresh/${cacheType}`)
}

export const clearCache = (cacheType: string) => {
  return request.delete<any, { message: string }>(`/admin/cache/clear/${cacheType}`)
}

export const listJobs = () => {
  return request.get<any, JobConfigVO[]>('/admin/jobs')
}

export const updateJob = (jobId: string, data: { cron?: string; enabled?: boolean }) => {
  return request.put<any, JobConfigVO>(`/admin/jobs/${jobId}`, data)
}

export const runJob = (jobId: string) => {
  return request.post<any, { status: string; message: string }>(`/admin/jobs/${jobId}/run`)
}

export const bindCsqaqIp = () => {
  return request.post<any, { code: number; msg: string; data: string }>('/admin/csqaq/bind-ip')
}
