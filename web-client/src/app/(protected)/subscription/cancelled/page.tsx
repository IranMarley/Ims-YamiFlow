'use client'
import Link from 'next/link'

export default function SubscriptionCancelledPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-text mb-2">Checkout Cancelled</h1>
        <p className="text-subtle mb-8">
          No charge was made. You can subscribe anytime to unlock premium courses.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/subscriptions"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            View Plans
          </Link>
          <Link
            href="/courses"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-surface border border-border text-sm font-medium text-text hover:bg-surface-hover transition-colors"
          >
            Browse Free Courses
          </Link>
        </div>
      </div>
    </div>
  )
}
