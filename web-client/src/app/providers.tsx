"use client"

import { useEffect, useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from '../lib/queryClient'
import { useAuthStore } from '../store/authStore'
import Spinner from '../components/ui/Spinner'

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
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        richColors
        position="top-right"
        closeButton
        toastOptions={{ closeButtonAriaLabel: 'Fechar' }}
      />
    </QueryClientProvider>
  )
}
