import axios, { type AxiosRequestConfig } from 'axios'
import { useAuthStore } from '../store/authStore'

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// Track whether a token refresh is already in progress to avoid parallel refresh calls
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: string) => void
  reject: (reason: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token!)
    }
  })
  failedQueue = []
}

// Request interceptor — attach JWT to every outgoing request
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState()
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor — handle 401 by refreshing the access token once
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    const isUnauthorized = error.response?.status === 401
    const alreadyRetried = originalRequest._retry === true
    const isRefreshEndpoint = originalRequest.url?.includes('/api/auth/refresh-token')

    // If the failed request is one of the auth endpoints (login/register/forgot/reset/confirm)
    // we should not attempt to refresh the token or redirect to /login — return the error
    // and let the caller (mutation/page) handle displaying the error message.
    const authEndpoints = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
      '/api/auth/confirm-email',
      '/api/auth/resend-confirmation',
      '/api/auth/logout',
    ]
    const isAuthEndpoint = authEndpoints.some((p) => originalRequest.url?.includes(p))

    if (isUnauthorized && !alreadyRetried && !isRefreshEndpoint) {
      if (isAuthEndpoint) {
        // Let the caller handle auth endpoint errors (e.g. show "invalid credentials")
        return Promise.reject(error)
      }
      if (isRefreshing) {
        // Queue the request while a refresh is already happening
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${token}`
            }
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const { refreshToken, setAccessToken, logout } = useAuthStore.getState()

      if (!refreshToken) {
        logout()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/api/auth/refresh-token`, {
          refreshToken,
        })

        const newAccessToken: string = data.accessToken
        setAccessToken(newAccessToken)
        processQueue(null, newAccessToken)

        if (originalRequest.headers) {
          (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${newAccessToken}`
        }

        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)
