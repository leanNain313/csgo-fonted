import request from '@/utils/request'
import type { PageResult } from '@/types'

export interface AdminUserVO {
  id: number
  username: string
  email?: string
  role: 'USER' | 'ADMIN'
  status: number
  createTime?: string
  updateTime?: string
}

export interface AdminUserCreateDTO {
  username: string
  password: string
  email?: string
  role?: 'USER' | 'ADMIN'
}

export const getAdminUserPage = (params: {
  current?: number
  size?: number
  keyword?: string
  role?: string
  status?: number
}) => {
  return request.get<any, PageResult<AdminUserVO>>('/admin/users/page', { params })
}

export const createAdminUser = (data: AdminUserCreateDTO) => {
  return request.post<any, AdminUserVO>('/admin/users', data)
}

export const updateAdminUserRole = (id: number, role: string) => {
  return request.put(`/admin/users/${id}/role`, { role })
}

export const updateAdminUserStatus = (id: number, status: number) => {
  return request.put(`/admin/users/${id}/status`, { status })
}

export const resetAdminUserPassword = (id: number, newPassword?: string) => {
  return request.put(`/admin/users/${id}/reset-password`, newPassword ? { newPassword } : {})
}
