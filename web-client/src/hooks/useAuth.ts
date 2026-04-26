'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { authService } from '../services/auth.service'
import { useAuthStore } from '../store/authStore'
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth'

function extractErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: unknown } })?.response?.data
  if (typeof data === 'string' && data.length > 0) return data
  if (data && typeof data === 'object' && 'message' in data) return String((data as { message: unknown }).message)
  return fallback
}

export function useLogin(redirectTo?: string) {
  const { setAuth } = useAuthStore()
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation<AuthResponse, Error, LoginRequest>({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onError: (err) => toast.error(extractErrorMessage(err, 'Login failed')),
    onSuccess: (response) => {
      setAuth(
        { userId: response.userId, email: response.email, fullName: response.fullName, role: response.role },
        response.accessToken,
        response.refreshToken,
      )
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['admin'] })
      if (redirectTo) {
        router.push(redirectTo)
        return
      }
      const role = response.role
      if (role === 'Instructor') {
        router.push('/instructor')
      } else {
        router.push('/dashboard')
      }
    },
  })
}

export function useRegister() {
  return useMutation<{ userId: string }, Error, RegisterRequest>({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onError: (err) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 500) {
        // For server errors show a generic message
        toast.error('Registration failed. Please try again later.')
      } else {
        // For client/validation errors show the server-provided message when available
        toast.error(extractErrorMessage(err, 'Registration failed'))
      }
    },
  })
}

export function useForgotPassword() {
  return useMutation<void, Error, string>({
    mutationFn: (email: string) => authService.forgotPassword(email),
    onError: (err) => toast.error(extractErrorMessage(err, 'Failed to send password reset')),
    onSuccess: () => toast.success('Password reset email sent.'),
  })
}

export function useResetPassword() {

  return useMutation<void, Error, { email: string; token: string; newPassword: string }>({
    mutationFn: (data: { email: string; token: string; newPassword: string }) =>
      authService.resetPassword(data),
    onError: (err) => toast.error(extractErrorMessage(err, 'Failed to reset password')),
    onSuccess: () => {
      // Let the page show pending/success UI; just show toast
      toast.success('Password reset successfully.')
    },
  })
}

export function useChangePassword() {
  return useMutation<void, Error, { currentPassword: string; newPassword: string }>({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authService.changePassword(data),
    onError: (err) => toast.error(extractErrorMessage(err, 'Failed to change password')),
    onSuccess: () => toast.success('Password changed successfully.'),
  })
}

export function useConfirmEmail() {
  return useMutation<void, Error, { email: string; token: string }>({
    mutationFn: (data: { email: string; token: string }) => authService.confirmEmail(data),
    onError: (err) => toast.error(extractErrorMessage(err, 'Failed to confirm email')),
    onSuccess: () => {
      toast.success('Email confirmed! You can now sign in.')
    },
  })
}

export function useResendConfirmation() {
  return useMutation<void, Error, string>({
    mutationFn: (email: string) => authService.resendConfirmation(email),
    onError: (err) => toast.error(extractErrorMessage(err, 'Failed to resend confirmation')),
    onSuccess: () => toast.success('Confirmation email sent. Check your inbox.'),
  })
}

export function useLogout() {
  const { logout } = useAuthStore()
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation<void, Error, void>({
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
