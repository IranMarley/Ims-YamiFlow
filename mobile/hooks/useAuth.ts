import { useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import Toast from 'react-native-toast-message'
import { authService } from '../services/auth.service'
import { useAuthStore } from '../store/authStore'
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth'

function extractErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: unknown } })?.response?.data
  if (typeof data === 'string' && data.length > 0) return data
  if (data && typeof data === 'object' && 'message' in data) return String((data as { message: unknown }).message)
  return fallback
}

export function useLogin() {
  const { setAuth } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation<AuthResponse, Error, LoginRequest>({
    mutationFn: (data) => authService.login(data),
    onError: (err) => Toast.show({ type: 'error', text1: 'Login failed', text2: extractErrorMessage(err, 'Invalid credentials') }),
    onSuccess: (response) => {
      queryClient.clear()
      setAuth(
        { userId: response.userId, email: response.email, fullName: response.fullName, role: response.role },
        response.accessToken,
        response.refreshToken,
      )
      router.replace('/(tabs)')
    },
  })
}

export function useRegister() {
  return useMutation<{ userId: string }, Error, RegisterRequest>({
    mutationFn: (data) => authService.register(data),
    onError: (err) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      const msg = status === 500
        ? 'Registration failed. Please try again later.'
        : extractErrorMessage(err, 'Registration failed')
      Toast.show({ type: 'error', text1: 'Error', text2: msg })
    },
  })
}

export function useForgotPassword() {
  return useMutation<void, Error, string>({
    mutationFn: (email) => authService.forgotPassword(email),
    onError: (err) => Toast.show({ type: 'error', text1: 'Error', text2: extractErrorMessage(err, 'Failed to send reset email') }),
    onSuccess: () => Toast.show({ type: 'success', text1: 'Email sent', text2: 'Check your inbox for reset instructions.' }),
  })
}

export function useResetPassword() {
  return useMutation<void, Error, { email: string; token: string; newPassword: string }>({
    mutationFn: (data) => authService.resetPassword(data),
    onError: (err) => Toast.show({ type: 'error', text1: 'Error', text2: extractErrorMessage(err, 'Failed to reset password') }),
    onSuccess: () => Toast.show({ type: 'success', text1: 'Password reset', text2: 'You can now sign in with your new password.' }),
  })
}

export function useChangePassword() {
  return useMutation<void, Error, { currentPassword: string; newPassword: string }>({
    mutationFn: (data) => authService.changePassword(data),
    onError: (err) => Toast.show({ type: 'error', text1: 'Error', text2: extractErrorMessage(err, 'Failed to change password') }),
    onSuccess: () => Toast.show({ type: 'success', text1: 'Password changed' }),
  })
}

export function useConfirmEmail() {
  return useMutation<void, Error, { email: string; token: string }>({
    mutationFn: (data) => authService.confirmEmail(data),
    onError: (err) => Toast.show({ type: 'error', text1: 'Error', text2: extractErrorMessage(err, 'Failed to confirm email') }),
    onSuccess: () => Toast.show({ type: 'success', text1: 'Email confirmed', text2: 'You can now sign in.' }),
  })
}

export function useResendConfirmation() {
  return useMutation<void, Error, string>({
    mutationFn: (email) => authService.resendConfirmation(email),
    onError: (err) => Toast.show({ type: 'error', text1: 'Error', text2: extractErrorMessage(err, 'Failed to resend confirmation') }),
    onSuccess: () => Toast.show({ type: 'success', text1: 'Email sent', text2: 'Check your inbox.' }),
  })
}

export function useLogout() {
  const { logout } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation<void, Error, void>({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      logout()
      queryClient.clear()
      router.replace('/(auth)/login')
    },
  })
}
