'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { toast } from 'sonner'
import Header from '../../components/layout/Header'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import {
  usePlans,
  useSubscription,
  useSubscribe,
  useCancelSubscription,
  useResumeSubscription,
} from '../../hooks/useSubscription'
import type { SubscriptionPlan } from '../../types/subscription'

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount)
}

function formatInterval(interval: string, count: number) {
  const base = interval.toLowerCase()
  return count === 1 ? `per ${base}` : `every ${count} ${base}s`
}

interface CheckoutModalProps {
  clientSecret: string
  publishableKey: string
  planName: string
  onClose: () => void
  onSuccess: () => void
}

function CheckoutForm({
  planName,
  onClose,
  onSuccess,
}: Omit<CheckoutModalProps, 'clientSecret' | 'publishableKey'>) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setSubmitting(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/subscription/success`,
      },
      redirect: 'if_required',
    })

    setSubmitting(false)
    if (error) {
      toast.error(error.message ?? 'Payment failed.')
      return
    }

    toast.success(`${planName} subscription activated!`)
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement />
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || submitting} loading={submitting}>
          Pay & subscribe
        </Button>
      </div>
    </form>
  )
}

function CheckoutModal({ clientSecret, publishableKey, planName, onClose, onSuccess }: CheckoutModalProps) {
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg bg-surface border border-border rounded-2xl p-6 shadow-xl">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-text">Complete your subscription</h2>
          <p className="text-subtle text-sm mt-0.5">{planName}</p>
        </div>
        <Elements
          stripe={stripePromise}
          options={{ clientSecret, appearance: { theme: 'stripe' } }}
        >
          <CheckoutForm planName={planName} onClose={onClose} onSuccess={onSuccess} />
        </Elements>
      </div>
    </div>
  )
}

export default function SubscriptionsPage() {
  const router = useRouter()
  const { data: plans, isLoading: plansLoading } = usePlans()
  const { data: current, isLoading: currentLoading } = useSubscription()
  const subscribe = useSubscribe()
  const cancel = useCancelSubscription()
  const resume = useResumeSubscription()

  const [checkout, setCheckout] = useState<{
    clientSecret: string
    publishableKey: string
    planName: string
  } | null>(null)

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    try {
      const res = await subscribe.mutateAsync(plan.id)
      if (!res.clientSecret || !res.publishableKey) {
        toast.error('Stripe is not configured on the server.')
        return
      }
      setCheckout({ clientSecret: res.clientSecret, publishableKey: res.publishableKey, planName: plan.name })
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } })?.response?.data ?? 'Failed to start subscription.'
      toast.error(String(msg))
    }
  }

  const handleCancel = async () => {
    if (!confirm('Cancel at period end? You keep access until the current period ends.')) return
    try {
      await cancel.mutateAsync(true)
      toast.success('Subscription will cancel at period end.')
    } catch {
      toast.error('Failed to cancel.')
    }
  }

  const handleResume = async () => {
    try {
      await resume.mutateAsync()
      toast.success('Subscription resumed.')
    } catch {
      toast.error('Failed to resume.')
    }
  }

  const isLoading = plansLoading || currentLoading

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {checkout && (
        <CheckoutModal
          {...checkout}
          onClose={() => setCheckout(null)}
          onSuccess={() => {
            setCheckout(null)
            router.push('/subscription/success')
          }}
        />
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-text">Subscription Plans</h1>
          <p className="text-subtle mt-1">Unlock unlimited access to all premium courses</p>
        </div>

        {current && (
          <div className="mb-8 bg-surface border border-border rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-subtle">Current plan</p>
              <p className="text-lg font-semibold text-text">
                {current.planName}{' '}
                <span className="text-sm font-normal text-subtle">({current.status})</span>
              </p>
              {current.currentPeriodEnd && (
                <p className="text-sm text-subtle mt-1">
                  {current.cancelAtPeriodEnd ? 'Ends' : 'Renews'} on{' '}
                  {new Date(current.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {current.cancelAtPeriodEnd ? (
                <Button onClick={handleResume} disabled={resume.isPending}>Resume</Button>
              ) : current.grantsAccess ? (
                <Button variant="secondary" onClick={handleCancel} disabled={cancel.isPending}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : plans && plans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrent = current?.planId === plan.id && current.grantsAccess
              return (
                <div
                  key={plan.id}
                  className="relative bg-surface border border-border rounded-2xl p-6 flex flex-col"
                >
                  <div className="mb-5">
                    <h2 className="text-lg font-bold text-text">{plan.name}</h2>
                    <p className="text-subtle text-sm mt-0.5">{plan.description}</p>
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-text">
                        {formatPrice(plan.amount, plan.currency)}
                      </span>
                      <span className="text-subtle text-sm ml-1">
                        {formatInterval(plan.interval, plan.intervalCount)}
                      </span>
                    </div>
                    {plan.trialDays ? (
                      <p className="text-xs text-success mt-2">{plan.trialDays}-day free trial</p>
                    ) : null}
                  </div>

                  <div className="flex-1" />

                  {isCurrent ? (
                    <div className="w-full py-2.5 rounded-xl bg-surface-hover border border-border text-center text-sm font-medium text-subtle">
                      Current Plan
                    </div>
                  ) : (
                    <Button
                      fullWidth
                      variant="primary"
                      onClick={() => handleSubscribe(plan)}
                      disabled={subscribe.isPending}
                    >
                      {subscribe.isPending ? 'Starting…' : `Subscribe to ${plan.name}`}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-center text-subtle py-16">No plans available.</p>
        )}

        <p className="mt-8 text-center text-xs text-subtle">
          Payments processed securely by Stripe. Cancel anytime.
        </p>
      </main>
    </div>
  )
}
