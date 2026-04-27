import { QueryClient } from '@tanstack/react-query'
import Toast from 'react-native-toast-message'

function extractMessage(error: unknown): string {
  const e = error as {
    response?: { data?: { message?: string; title?: string; errors?: Record<string, string[]> } }
    message?: string
  }

  const validationErrors = e?.response?.data?.errors
  if (validationErrors) {
    const first = Object.values(validationErrors).flat()[0]
    if (first) return first
  }

  return (
    e?.response?.data?.message ??
    e?.response?.data?.title ??
    e?.message ??
    'An unexpected error occurred.'
  )
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: (failureCount, error) => {
        const status = (error as { response?: { status: number } })?.response?.status
        if (status === 401 || status === 403 || status === 404) return false
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
      onError: (error) => {
        Toast.show({ type: 'error', text1: 'Error', text2: extractMessage(error) })
      },
    },
  },
})
