"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'

export function useRedirectIfAuthenticated(redirectTo?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) return
    if (redirectTo) {
      router.push(redirectTo)
    } else {
      if (user?.role === 'Admin') router.push('/admin')
      else if (user?.role === 'Instructor') router.push('/instructor')
      else router.push('/dashboard')
    }
  }, [isAuthenticated, redirectTo, router, user?.role])
}

export default useRedirectIfAuthenticated
