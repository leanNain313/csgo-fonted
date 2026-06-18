import request from '@/utils/request'

export interface UserRegisterDTO {
  username: string
  password: string
  email: string
  verificationCode: string
}

export interface UserLoginDTO {
  username: string
  password: string
}

export interface UserResetPasswordDTO {
  email: string
  verificationCode: string
  newPassword: string
}

export interface IpLocationVO {
  ip?: string
  country?: string
  region?: string
  city?: string
  isp?: string
  location?: string
}

export interface UserVO {
  id: number
  username: string
  email: string
  role: 'USER' | 'ADMIN'
  token: string
  loginInfo?: IpLocationVO
}

export const register = (data: UserRegisterDTO) => {
  return request.post<any, UserVO>('/user/register', data)
}

export const login = (data: UserLoginDTO) => {
  return request.post<any, UserVO>('/user/login', data)
}

export const getCurrentUser = () => {
  return request.get<any, UserVO>('/user/me')
}

export const resetPassword = (data: UserResetPasswordDTO) => {
  return request.post('/user/reset-password', data)
}

export const sendVerificationCode = (email: string, type: 'REGISTER' | 'RESET_PASSWORD') => {
  return request.post('/user/send-code', null, { params: { email, type } })
}
