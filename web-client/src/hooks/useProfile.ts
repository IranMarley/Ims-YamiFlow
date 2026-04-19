import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { profileService } from '../services/profile.service'

export function useProfile() {
  return useQuery<any, Error>({
    queryKey: ['profile'],
    queryFn: profileService.getProfile,
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation<any, Error, string>({
    mutationFn: (fullName: string) => profileService.updateProfile(fullName),
  onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['profile'] })
      const previous = qc.getQueryData(['profile'])
      return { previous }
    },
    onError: (err, _vars, context: any) => {
      if (context?.previous) qc.setQueryData(['profile'], context.previous)
      toast.error((err as Error)?.message || 'Failed to update profile')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Profile updated.')
    },
  })
}
