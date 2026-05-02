import { api } from '../lib/axios'
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth'

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', data)
    return response.data
  },

  async register(data: RegisterRequest): Promise<{ userId: string }> {
    const response = await api.post<{ userId: string }>('/api/auth/register', data)
    return response.data
  },

  async refreshToken(token: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/refresh-token', {
      refreshToken: token,
    })
    return response.data
  },

  async logout(): Promise<void> {
    await api.post('/api/auth/logout')
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/api/auth/forgot-password', { email })
  },

  async resetPassword(data: { email: string; token: string; newPassword: string }): Promise<void> {
    await api.post('/api/auth/reset-password', data)
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    await api.post('/api/auth/change-password', data)
  },

  async confirmEmail(data: { email: string; token: string }): Promise<void> {
    await api.post('/api/auth/confirm-email', data)
  },

  async resendConfirmation(email: string): Promise<void> {
    await api.post('/api/auth/resend-confirmation', { email })
  },

  async googleLogin(idToken: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/google-login', { idToken })
    return response.data
  },
}
