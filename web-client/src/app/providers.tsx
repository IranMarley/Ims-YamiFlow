"use client"

import { useEffect, useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from 'sonner'
import { queryClient } from '../lib/queryClient'
import { useAuthStore } from '../store/authStore'
import Spinner from '../components/ui/Spinner'

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''

export default function Providers({ children }: { children: React.ReactNode }) {
  const [rehydrated, setRehydrated] = useState(false)

  useEffect(() => {
    const maybeThenable = useAuthStore.persist.rehydrate()
    Promise.resolve(maybeThenable)
      .catch(() => {
      })
      .finally(() => setRehydrated(true))
  }, [])

  if (!rehydrated)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          richColors
          position="top-right"
          closeButton
          toastOptions={{ closeButtonAriaLabel: 'Fechar' }}
        />
      </QueryClientProvider>
    </GoogleOAuthProvider>
  )
}
