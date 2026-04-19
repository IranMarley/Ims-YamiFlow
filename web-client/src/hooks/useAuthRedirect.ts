"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'

// Hook: redirect to /dashboard if the user is authenticated
export function useRedirectIfAuthenticated(redirectTo: string = '/dashboard') {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) router.push(redirectTo)
  }, [isAuthenticated, redirectTo, router])
}

export default useRedirectIfAuthenticated
