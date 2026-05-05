'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Header from '../../components/layout/Header'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import {
  usePlans,
  useSubscription,
  useCancelSubscription,
  useResumeSubscription,
} from '../../hooks/useSubscription'
import type { SubscriptionDetail, SubscriptionPlan } from '../../types/subscription'

// ── Helpers ───────────────────────────────────────────

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

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function sanitizeError(e: unknown): string {
  if (typeof e === 'string') return e
  if (e instanceof Error) {
    const msg = e.message
    if (msg.includes('401') || msg.includes('403')) return 'Session expired. Please sign in again.'
    if (msg.includes('500') || msg.includes('502') || msg.includes('503')) return 'A server error occurred. Please try again.'
    if (msg.includes('Network') || msg.includes('fetch')) return 'Connection error. Check your internet and try again.'
    return msg
  }
  if (typeof e === 'object' && e !== null) {
    const obj = e as Record<string, unknown>
    const data = obj?.response as Record<string, unknown> | undefined
    const msg = data?.data ?? data?.message ?? obj?.message
    if (typeof msg === 'string') return sanitizeError(msg)
  }
  return 'Something went wrong. Please try again.'
}

// ── Status badge ──────────────────────────────────────

function StatusBadge({ status, cancelAtPeriodEnd }: { status: string; cancelAtPeriodEnd: boolean }) {
  const s = status.toLowerCase()

  if (cancelAtPeriodEnd) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-warning/10 text-warning border border-warning/20">
        <span className="w-1.5 h-1.5 rounded-full bg-warning" />
        Canceling at period end
      </span>
    )
  }

  const map: Record<string, { label: string; color: string }> = {
    active:             { label: 'Active',           color: 'bg-success/10 text-success border-success/20' },
    trialing:           { label: 'Trial',            color: 'bg-primary/10 text-primary border-primary/20' },
    pastdue:            { label: 'Past Due',         color: 'bg-error/10 text-error border-error/20' },
    canceled:           { label: 'Canceled',         color: 'bg-subtle/10 text-subtle border-subtle/20' },
    incomplete:         { label: 'Incomplete',       color: 'bg-warning/10 text-warning border-warning/20' },
    incompleteexpired:  { label: 'Expired',          color: 'bg-subtle/10 text-subtle border-subtle/20' },
    unpaid:             { label: 'Unpaid',           color: 'bg-error/10 text-error border-error/20' },
    paused:             { label: 'Paused',           color: 'bg-subtle/10 text-subtle border-subtle/20' },
  }

  const key = s.replace(/[^a-z]/g, '')
  const cfg = map[key] ?? { label: status, color: 'bg-subtle/10 text-subtle border-subtle/20' }
  const dotColors: Record<string, string> = {
    active: 'bg-success', trialing: 'bg-primary', pastdue: 'bg-error',
    canceled: 'bg-subtle', incomplete: 'bg-warning', incompleteexpired: 'bg-subtle',
    unpaid: 'bg-error', paused: 'bg-subtle',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[key] ?? 'bg-subtle'}`} />
      {cfg.label}
    </span>
  )
}

// ── Cancel confirmation modal ─────────────────────────

function CancelModal({
  planName,
  periodEnd,
  onConfirm,
  onClose,
  loading,
}: {
  planName: string
  periodEnd: string | null
  onConfirm: () => void
  onClose: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 shadow-2xl">
        <div className="flex items-start gap-4 mb-5">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-text">Cancel subscription?</h2>
            <p className="text-sm text-subtle mt-1">
              Your <span className="text-text font-medium">{planName}</span> plan will remain active
              until <span className="text-text font-medium">{formatDate(periodEnd)}</span>. After that,
              you will lose access to all premium courses.
            </p>
          </div>
        </div>

        <div className="bg-background/60 border border-border rounded-xl p-3 mb-5 text-xs text-subtle space-y-1">
          <p>• No refund is issued for the remaining period</p>
          <p>• You can resume the subscription before it expires</p>
          <p>• Free courses remain accessible after cancellation</p>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Keep subscription
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            Yes, cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Subscription details card ─────────────────────────

function SubscriptionCard({
  current,
  onCancel,
  onResume,
  resumeLoading,
}: {
  current: SubscriptionDetail
  onCancel: () => void
  onResume: () => void
  resumeLoading: boolean
}) {
  const billingLabel = (() => {
    const interval = current.interval?.toLowerCase() ?? ''
    if (interval === 'month') return 'Monthly'
    if (interval === 'year') return 'Annual'
    return current.interval
  })()

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden mb-10">
      <div className="px-6 py-5 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-subtle uppercase tracking-wide font-medium mb-1">Current Subscription</p>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-text">{current.planName}</h2>
            <StatusBadge status={current.status} cancelAtPeriodEnd={current.cancelAtPeriodEnd} />
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-text">
            {formatPrice(current.amount, current.currency)}
          </p>
          <p className="text-xs text-subtle">{billingLabel}</p>
        </div>
      </div>

      <div className="px-6 py-5 grid grid-cols-2 sm:grid-cols-3 gap-5">
        <div>
          <p className="text-xs text-subtle mb-1">Billing period start</p>
          <p className="text-sm font-medium text-text">{formatDate(current.currentPeriodStart)}</p>
        </div>
        <div>
          <p className="text-xs text-subtle mb-1">
            {current.cancelAtPeriodEnd ? 'Access until' : 'Next renewal'}
          </p>
          <p className={`text-sm font-medium ${current.cancelAtPeriodEnd ? 'text-warning' : 'text-text'}`}>
            {formatDate(current.currentPeriodEnd)}
          </p>
        </div>
        {current.trialEnd && (
          <div>
            <p className="text-xs text-subtle mb-1">Trial ends</p>
            <p className="text-sm font-medium text-primary">{formatDate(current.trialEnd)}</p>
          </div>
        )}
      </div>

      {current.grantsAccess && (
        <div className="px-6 py-4 border-t border-border bg-background/40 flex flex-wrap items-center justify-between gap-3">
          {current.cancelAtPeriodEnd ? (
            <>
              <p className="text-sm text-subtle">
                Subscription scheduled to cancel. Resume to keep access.
              </p>
              <Button size="sm" variant="primary" onClick={onResume} loading={resumeLoading}>
                Resume subscription
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-subtle">
                Need to cancel? You keep full access until the period ends.
              </p>
              <Button size="sm" variant="secondary" onClick={onCancel}>
                Cancel subscription
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Plan card ─────────────────────────────────────────

function PlanCard({
  plan,
  isCurrent,
  hasActive,
  onSubscribe,
  subscribing,
}: {
  plan: SubscriptionPlan
  isCurrent: boolean
  hasActive: boolean
  onSubscribe: () => void
  subscribing: boolean
}) {
  return (
    <div className={`relative bg-surface border rounded-2xl p-6 flex flex-col transition-all ${
      isCurrent ? 'border-primary/50 shadow-lg shadow-primary/5' : 'border-border'
    }`}>
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 rounded-full bg-primary text-white text-xs font-semibold shadow">
            Current Plan
          </span>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-lg font-bold text-text">{plan.name}</h2>
        <p className="text-subtle text-sm mt-1 leading-relaxed">{plan.description}</p>
        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-3xl font-bold text-text">{formatPrice(plan.amount, plan.currency)}</span>
          <span className="text-subtle text-sm">{formatInterval(plan.interval, plan.intervalCount)}</span>
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

      <div className="flex-1" />

      {isCurrent ? (
        <div className="w-full py-2.5 rounded-xl bg-primary/5 border border-primary/20 text-center text-sm font-medium text-primary">
          Your active plan
        </div>
      ) : (
        <Button
          fullWidth
          variant="primary"
          onClick={onSubscribe}
          disabled={subscribing}
          loading={subscribing}
        >
          {subscribing
            ? 'Loading…'
            : hasActive
              ? `Switch to ${plan.name}`
              : `Get ${plan.name}`}
        </Button>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────

export default function SubscriptionsPage() {
  const router = useRouter()
  const { data: plans, isLoading: plansLoading } = usePlans()
  const { data: current, isLoading: currentLoading } = useSubscription()
  const cancel = useCancelSubscription()
  const resume = useResumeSubscription()

  const [showCancelModal, setShowCancelModal] = useState(false)

  const hasActive = !!(current?.grantsAccess)

  const handleSubscribe = (plan: SubscriptionPlan) => {
    router.push(`/subscription/checkout?planId=${plan.id}`)
  }

  const handleConfirmCancel = async () => {
    try {
      await cancel.mutateAsync(true)
      setShowCancelModal(false)
      toast.success('Subscription will cancel at the end of the billing period.')
    } catch {
      toast.error('Failed to cancel subscription. Please try again.')
    }
  }

  const handleResume = async () => {
    try {
      await resume.mutateAsync()
      toast.success('Subscription resumed successfully.')
    } catch {
      toast.error('Failed to resume subscription. Please try again.')
    }
  }

  const isLoading = plansLoading || currentLoading

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {showCancelModal && current && (
        <CancelModal
          planName={current.planName}
          periodEnd={current.currentPeriodEnd}
          onConfirm={handleConfirmCancel}
          onClose={() => setShowCancelModal(false)}
          loading={cancel.isPending}
        />
      )}

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text">
            {hasActive ? 'My Subscription' : 'Choose a Plan'}
          </h1>
          <p className="text-subtle mt-1">
            {hasActive
              ? 'Manage your subscription and billing details.'
              : 'Unlock unlimited access to all premium courses.'}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-24"><Spinner size="lg" /></div>
        ) : (
          <>
            {current && (
              <SubscriptionCard
                current={current}
                onCancel={() => setShowCancelModal(true)}
                onResume={handleResume}
                resumeLoading={resume.isPending}
              />
            )}

            {plans && plans.length > 0 && (
              <>
                {current && (
                  <h2 className="text-lg font-semibold text-text mb-4">
                    {hasActive ? 'Available Plans' : 'Select a Plan'}
                  </h2>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {plans.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      isCurrent={current?.planId === plan.id && !!current.grantsAccess}
                      hasActive={hasActive}
                      onSubscribe={() => handleSubscribe(plan)}
                      subscribing={false}
                    />
                  ))}
                </div>
              </>
            )}

            {!current && !plans?.length && (
              <p className="text-center text-subtle py-16">No plans available.</p>
            )}
          </>
        )}

        <p className="mt-10 text-center text-xs text-subtle">
          Payments processed securely. Cancel anytime before renewal.
        </p>
      </main>
    </div>
  )
}
