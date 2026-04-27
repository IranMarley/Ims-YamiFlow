import { api } from '../lib/axios'

export interface ProfileResponse {
  userId: string
  email: string
  fullName?: string
  role?: string
}

export const profileService = {
  async getProfile(): Promise<ProfileResponse> {
    const { data } = await api.get<ProfileResponse>('/api/auth/profile')
    return data
  },

  async updateProfile(fullName: string): Promise<ProfileResponse> {
    const { data } = await api.put<ProfileResponse>('/api/auth/profile', { fullName })
    return data
  },
}
