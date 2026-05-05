'use client'
import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import Link from 'next/link'
import Header from '../../components/layout/Header'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { usePlans, useSubscribe } from '../../hooks/useSubscription'
import { subscriptionService } from '../../services/subscription.service'
import type { SubscriptionPlan } from '../../types/subscription'

// ── Helpers ───────────────────────────────────────────

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

// ── Payment form ──────────────────────────────────────

function PaymentForm({ plan, onSuccess }: { plan: SubscriptionPlan; onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [elementsReady, setElementsReady] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements || !elementsReady) return
    setSubmitting(true)
    setErrorMsg(null)

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/subscription/success`,
        },
        redirect: 'if_required',
      })

      if (error) {
        if (error.type === 'card_error' || error.type === 'validation_error') {
          setErrorMsg(error.message ?? 'Payment declined. Check your card details.')
        } else {
          setErrorMsg('Payment could not be processed. Please try again.')
        }
        return
      }

      onSuccess()
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment element */}
      <div className="min-h-[200px]">
        {!elementsReady && (
          <div className="space-y-3 animate-pulse">
            <div className="h-12 rounded-xl bg-border/40" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-12 rounded-xl bg-border/40" />
              <div className="h-12 rounded-xl bg-border/40" />
            </div>
            <div className="h-12 rounded-xl bg-border/40" />
          </div>
        )}
        <div className={elementsReady ? '' : 'invisible h-0 overflow-hidden'}>
          <PaymentElement onReady={() => setElementsReady(true)} />
        </div>
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="flex items-start gap-2.5 p-4 rounded-xl bg-danger/8 border border-danger/20">
          <svg className="w-4 h-4 text-danger shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-danger">{errorMsg}</p>
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        fullWidth
        disabled={!stripe || !elementsReady || submitting}
        loading={submitting}
      >
        {submitting ? 'Processing payment…' : `Pay ${formatPrice(plan.amount, plan.currency)}`}
      </Button>

      <p className="text-center text-xs text-subtle flex items-center justify-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Secured by Stripe. Card details are never stored on our servers.
      </p>
    </form>
  )
}

// ── Checkout inner (needs searchParams) ───────────────

function CheckoutInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get('planId')

  const { data: plans, isLoading: plansLoading } = usePlans()
  const subscribe = useSubscribe()

  const plan = useMemo(
    () => plans?.find((p) => p.id === planId),
    [plans, planId],
  )

  const [stripeState, setStripeState] = useState<{
    clientSecret: string
    publishableKey: string
  } | null>(null)
  const [initError, setInitError] = useState<string | null>(null)
  const [initializing, setInitializing] = useState(false)

  // Subscribe once plan is known
  useEffect(() => {
    if (!planId || !plan || stripeState || initializing || subscribe.isPending) return
    setInitializing(true)

    subscribe.mutateAsync(planId)
      .then((res) => {
        if (!res.clientSecret) {
          // Simulated or already-active (no payment needed)
          router.replace('/subscription/success')
          return
        }
        if (!res.publishableKey) {
          setInitError('Payment is not configured. Please contact support.')
          return
        }
        setStripeState({ clientSecret: res.clientSecret, publishableKey: res.publishableKey })
      })
      .catch(() => {
        setInitError('Could not initialize payment. Please go back and try again.')
      })
      .finally(() => setInitializing(false))
  }, [planId, plan]) // eslint-disable-line react-hooks/exhaustive-deps

  const stripePromise = useMemo(
    () => (stripeState ? loadStripe(stripeState.publishableKey) : null),
    [stripeState?.publishableKey], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const handlePaymentSuccess = () => {
    router.push('/subscription/success')
  }

  // ── Loading ──────────────────────────────────────────
  if (plansLoading || initializing || (!stripeState && !initError && planId)) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-lg mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-text">Setting up payment…</h1>
            <p className="text-subtle mt-1 text-sm">This only takes a moment.</p>
          </div>
          <div className="bg-surface border border-border rounded-2xl p-8 flex flex-col items-center gap-4">
            <Spinner size="lg" />
            <p className="text-sm text-subtle">Connecting to payment provider…</p>
          </div>
        </main>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────
  if (initError || !planId || (!plansLoading && !plan)) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="bg-surface border border-border rounded-2xl p-8">
            <div className="w-12 h-12 rounded-xl bg-danger/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-text mb-2">Payment setup failed</h2>
            <p className="text-sm text-subtle mb-6">
              {initError ?? 'Invalid or missing plan. Please return to the plans page.'}
            </p>
            <Link
              href="/subscriptions"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Back to plans
            </Link>
          </div>
        </main>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-10">

        {/* Back link */}
        <Link
          href="/subscriptions"
          className="inline-flex items-center gap-1.5 text-sm text-subtle hover:text-text transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to plans
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Left — order summary */}
          <div className="lg:col-span-2">
            <h1 className="text-2xl font-bold text-text mb-6">Complete subscription</h1>

            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <div>
                <p className="text-xs text-subtle uppercase tracking-wide font-medium mb-1">Plan</p>
                <p className="text-base font-bold text-text">{plan!.name}</p>
                {plan!.description && (
                  <p className="text-sm text-subtle mt-1">{plan!.description}</p>
                )}
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-xs text-subtle uppercase tracking-wide font-medium mb-1">Billing</p>
                <p className="text-2xl font-bold text-text">
                  {formatPrice(plan!.amount, plan!.currency)}
                </p>
                <p className="text-sm text-subtle">{formatInterval(plan!.interval, plan!.intervalCount)}</p>
              </div>

              {plan!.trialDays ? (
                <div className="bg-success/5 border border-success/20 rounded-xl px-3 py-2.5">
                  <p className="text-sm text-success font-medium flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {plan!.trialDays}-day free trial included
                  </p>
                  <p className="text-xs text-subtle mt-0.5 ml-5.5">No charge until trial ends</p>
                </div>
              ) : null}

              <div className="border-t border-border pt-4 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-subtle">Subtotal</span>
                  <span className="text-text font-medium">{formatPrice(plan!.amount, plan!.currency)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-text">Total today</span>
                  <span className="text-text">
                    {plan!.trialDays ? formatPrice(0, plan!.currency) : formatPrice(plan!.amount, plan!.currency)}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-subtle mt-4 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Cancel anytime before the next renewal date.
            </p>
          </div>

          {/* Right — payment form */}
          <div className="lg:col-span-3">
            <h2 className="text-lg font-semibold text-text mb-5">Payment details</h2>

            {stripeState && stripePromise && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: stripeState.clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: { borderRadius: '12px', fontSizeBase: '14px' },
                  },
                }}
              >
                <PaymentForm plan={plan!} onSuccess={handlePaymentSuccess} />
              </Elements>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

// ── Page export (Suspense boundary for useSearchParams) ──

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    }>
      <CheckoutInner />
    </Suspense>
  )
}
