import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { profileService } from '../services/profile.service'
import { useAuthStore } from '../store/authStore'

const profileKeys = {
  all: ['profile'] as const,
}

export function useProfile() {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: profileKeys.all,
    queryFn: () => profileService.getProfile(),
    enabled: !!user,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { setAuth, accessToken, refreshToken } = useAuthStore()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: (fullName: string) => profileService.updateProfile(fullName),
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.all, data)
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
      if (user && accessToken && refreshToken) {
        setAuth({ ...user, fullName: data.fullName }, accessToken, refreshToken)
      }
    },
  })
}
