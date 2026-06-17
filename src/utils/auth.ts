const TOKEN_KEY = 'token'
const USER_KEY = 'user'

export type UserRole = 'USER' | 'ADMIN'

export interface AuthUser {
  id: number
  username: string
  email: string
  role: UserRole
  token?: string
}

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY)
}

export const setToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY)
}

export const getUser = (): AuthUser | null => {
  const user = localStorage.getItem(USER_KEY)
  return user ? JSON.parse(user) : null
}

export const setUser = (user: AuthUser) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const removeUser = () => {
  localStorage.removeItem(USER_KEY)
}

export const logout = () => {
  removeToken()
  removeUser()
}

export const isAdmin = () => getUser()?.role === 'ADMIN'

export const getRoleLabel = (role?: string) => {
  return role === 'ADMIN' ? '管理员' : '普通用户'
}

export const getUserInitial = (username?: string) => {
  if (!username) return 'U'
  return username.slice(0, 1).toUpperCase()
}
