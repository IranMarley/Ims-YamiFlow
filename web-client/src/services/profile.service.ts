import { api } from '../lib/axios'

export interface ProfileResponse {
  id: string
  email: string
  fullName: string
  isActive: boolean
}

export const profileService = {
  async getProfile(): Promise<ProfileResponse> {
    const response = await api.get<ProfileResponse>('/api/auth/profile')
    return response.data
  },
  async updateProfile(fullName: string): Promise<ProfileResponse> {
    const response = await api.put<ProfileResponse>('/api/auth/profile', { fullName })
    return response.data
  },
}
