'use client'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../lib/publicApi'
import { useAuthStore } from '../../store/authStore'
import PublicHeader from '../../components/layout/PublicHeader'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import type { SubscriptionPlan } from '../../types/subscription'

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount)
}

function formatInterval(interval: string, count: number) {
  const base = interval.toLowerCase()
  return count === 1 ? `/ ${base}` : `every ${count} ${base}s`
}

function PlanCard({
  plan,
  onSubscribe,
}: {
  plan: SubscriptionPlan
  onSubscribe: () => void
}) {
  const isAnnual = plan.interval.toLowerCase() === 'year'

  return (
    <div
      className={`relative bg-surface border rounded-2xl p-8 flex flex-col transition-all ${
        isAnnual
          ? 'border-primary/50 shadow-xl shadow-primary/5'
          : 'border-border'
      }`}
    >
      {isAnnual && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 rounded-full bg-primary text-white text-xs font-semibold shadow">
            Best value
          </span>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-bold text-text">{plan.name}</h2>
        <p className="text-subtle text-sm mt-2 leading-relaxed">{plan.description}</p>
        <div className="mt-5 flex items-baseline gap-1">
          <span className="text-4xl font-bold text-text">
            {formatPrice(plan.amount, plan.currency)}
          </span>
          <span className="text-subtle text-sm">
            {formatInterval(plan.interval, plan.intervalCount)}
          </span>
        </div>
        {plan.trialDays ? (
          <p className="text-xs text-success mt-2 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {plan.trialDays}-day free trial included
          </p>
        ) : null}
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {[
          'Unlimited access to all premium courses',
          'New courses added every month',
          'Download resources & materials',
          'Certificate of completion',
          'Priority support',
        ].map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-subtle">
            <svg
              className="w-4 h-4 text-success shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      <Button fullWidth variant="primary" onClick={onSubscribe}>
        Get started
      </Button>
    </div>
  )
}

export default function PricingPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  const { data: plans, isLoading } = useQuery({
    queryKey: ['public-plans'],
    queryFn: async () => {
      const { data } = await publicApi.get<SubscriptionPlan[]>('/api/subscriptions/plans')
      return data
    },
  })

  const handleSubscribe = () => {
    if (isAuthenticated) {
      router.push('/subscriptions')
    } else {
      router.push('/login?redirect=/subscriptions')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center mb-14">
          <h1 className="text-4xl sm:text-5xl font-bold text-text">
            Simple, transparent pricing
          </h1>
          <p className="text-subtle mt-4 text-lg max-w-xl mx-auto">
            One subscription. Unlimited access to every premium course on the platform.
          </p>
        </div>

        {/* Free tier callout */}
        <div className="mb-10 bg-surface border border-border rounded-2xl px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-text">Free tier — always available</p>
            <p className="text-sm text-subtle mt-0.5">
              Browse and complete free courses with no credit card required.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => router.push('/courses')}>
            Browse free courses
          </Button>
        </div>

        {/* Plans */}
        {isLoading ? (
          <div className="flex justify-center py-24">
            <Spinner size="lg" />
          </div>
        ) : !plans?.length ? (
          <p className="text-center text-subtle py-16">No plans available yet.</p>
        ) : (
          <div className={`grid gap-6 ${plans.length === 1 ? 'max-w-sm mx-auto' : 'sm:grid-cols-2'}`}>
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onSubscribe={handleSubscribe} />
            ))}
          </div>
        )}

        {/* FAQ / reassurance */}
        <p className="mt-12 text-center text-xs text-subtle">
          Cancel anytime before renewal. Payments processed securely via Stripe.
        </p>
      </main>
    </div>
  )
}
