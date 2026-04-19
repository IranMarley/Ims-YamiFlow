export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  userId: string
  email: string
  fullName: string
  role: string
}

export interface User {
  userId: string
  email: string
  fullName?: string
  role?: string
}
