'use client'
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import Spinner from '../../../../components/ui/Spinner'
import { subscriptionService } from '../../../../services/subscription.service'
import { subscriptionKeys } from '../../../../hooks/useSubscription'

const MAX_POLLS = 20   // up to ~20s max wait
const POLL_MS   = 1000 // 1s interval — Stripe usually flips within 2-3s

export default function SubscriptionSuccessPage() {
  const queryClient = useQueryClient()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function pollUntilActive() {
      for (let i = 0; i < MAX_POLLS; i++) {
        await new Promise((r) => setTimeout(r, POLL_MS))
        if (cancelled) return

        try {
          const result = await subscriptionService.sync()
          if (result.grantsAccess) {
            // Use refetchQueries (awaits) so the cache is warm with Active data before the
            // user navigates away — prevents stale Incomplete data flashing on course pages.
            await queryClient.refetchQueries({ queryKey: subscriptionKeys.current })
            if (!cancelled) setReady(true)
            return
          }
        } catch {
          // sync failed — keep polling
        }
      }

      // Timed out — payment went through but webhook is slow; show success anyway
      await queryClient.refetchQueries({ queryKey: subscriptionKeys.current })
      if (!cancelled) setReady(true)
    }

    pollUntilActive()
    return () => { cancelled = true }
  }, [queryClient])

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <Spinner size="lg" className="mx-auto mb-6" />
          <h1 className="text-xl font-bold text-text mb-2">Activating your subscription…</h1>
          <p className="text-sm text-subtle">Confirming payment with Stripe. This takes just a moment.</p>
        </div>
      </div>
    )
  }

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
          You now have unlimited access to all premium courses.
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
