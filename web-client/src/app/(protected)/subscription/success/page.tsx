'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { subscriptionKeys } from '../../../../hooks/useSubscription'

export default function SubscriptionSuccessPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: subscriptionKeys.current })
  }, [queryClient])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-text mb-2">Subscription Active!</h1>
        <p className="text-subtle mb-8">
          Welcome to Pro. You now have unlimited access to all premium courses.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/courses"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Browse Courses
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-surface border border-border text-sm font-medium text-text hover:bg-surface-hover transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
