'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { authService } from '../services/auth.service'
import { useAuthStore } from '../store/authStore'
import type { LoginRequest, RegisterRequest } from '../types/auth'

export function useLogin() {
  const { setAuth } = useAuthStore()
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation<any, Error, LoginRequest>({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onError: (err) => toast.error((err as Error)?.message || 'Login failed'),
    onSuccess: (response) => {
      setAuth(
        { userId: response.userId, email: response.email, fullName: response.fullName, role: response.role },
        response.accessToken,
        response.refreshToken,
      )
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['admin'] })
      router.push('/dashboard')
    },
  })
}

export function useRegister() {
  const router = useRouter()

  return useMutation<any, Error, RegisterRequest>({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onError: (err) => toast.error((err as Error)?.message || 'Registration failed'),
    onSuccess: () => {
      router.push('/login')
    },
  })
}

export function useForgotPassword() {
  return useMutation<any, Error, string>({
    mutationFn: (email: string) => authService.forgotPassword(email),
    onError: (err) => toast.error((err as Error)?.message || 'Failed to send password reset'),
    onSuccess: () => toast.success('Password reset email sent.'),
  })
}

export function useResetPassword() {
  const router = useRouter()

  return useMutation<any, Error, { email: string; token: string; newPassword: string }>({
    mutationFn: (data: { email: string; token: string; newPassword: string }) =>
      authService.resetPassword(data),
    onError: (err) => toast.error((err as Error)?.message || 'Failed to reset password'),
    onSuccess: () => {
      router.push('/login')
    },
  })
}

export function useChangePassword() {
  return useMutation<any, Error, { currentPassword: string; newPassword: string }>({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authService.changePassword(data),
    onError: (err) => toast.error((err as Error)?.message || 'Failed to change password'),
    onSuccess: () => toast.success('Password changed successfully.'),
  })
}

export function useConfirmEmail() {
  const router = useRouter()

  return useMutation<any, Error, { email: string; token: string }>({
    mutationFn: (data: { email: string; token: string }) => authService.confirmEmail(data),
    onError: (err) => toast.error((err as Error)?.message || 'Failed to confirm email'),
    onSuccess: () => {
      router.push('/login')
    },
  })
}

export function useResendConfirmation() {
  return useMutation<any, Error, string>({
    mutationFn: (email: string) => authService.resendConfirmation(email),
    onError: (err) => toast.error((err as Error)?.message || 'Failed to resend confirmation'),
  })
}

export function useLogout() {
  const { logout } = useAuthStore()
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation<any, Error, void>({
    mutationFn: () => authService.logout(),
    onError: (err) => toast.error((err as Error)?.message || 'Logout failed'),
    onSettled: () => {
      logout()
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['admin'] })
      router.push('/login')
    },
  })
}
