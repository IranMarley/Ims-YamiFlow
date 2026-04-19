'use client'
import { useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useConfirmEmail } from '../../hooks/useAuth'
import Button from '../../components/ui/Button'
import useRedirectIfAuthenticated from '../../hooks/useAuthRedirect'

export default function ConfirmEmailPage() {
  const searchParams = useSearchParams()
  const confirmMutation = useConfirmEmail()
  const called = useRef(false)
  const router = useRouter()
  useRedirectIfAuthenticated()

  const email = searchParams.get('email') ?? ''
  const token = searchParams.get('token') ?? ''

  useEffect(() => {
    if (called.current || !email || !token) return
    called.current = true
  // reset previous mutation state (clears prior errors) then trigger
  confirmMutation.reset()
  confirmMutation.mutate({ email, token })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!confirmMutation.isSuccess) return
    const t = setTimeout(() => router.push('/login'), 3000)
    return () => clearTimeout(t)
  }, [confirmMutation.isSuccess, router])

  const missingParams = !email || !token

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/30 mb-4">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text">Email confirmation</h1>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8 shadow-xl text-center space-y-4">
          {missingParams ? (
            <>
              <div className="w-14 h-14 rounded-full bg-danger/15 flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text">Invalid link</h3>
                <p className="text-sm text-subtle mt-1">This confirmation link is missing required parameters.</p>
              </div>
              <Link href="/login"><Button fullWidth>Go to sign in</Button></Link>
            </>
          ) : confirmMutation.isIdle || confirmMutation.isPending ? (
            <>
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
                <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text">Confirming your email…</h3>
                <p className="text-sm text-subtle mt-1">Please wait a moment.</p>
              </div>
            </>
          ) : confirmMutation.isSuccess ? (
            <>
              <div className="w-14 h-14 rounded-full bg-success/15 flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text">Email confirmed!</h3>
                <p className="text-sm text-subtle mt-1">Your account is active. You can now sign in.</p>
              </div>
              <Link href="/login"><Button fullWidth>Sign in</Button></Link>
            </>
          ) : confirmMutation.isError ? (
            <>
              <div className="w-14 h-14 rounded-full bg-danger/15 flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text">Confirmation failed</h3>
                <p className="text-sm text-subtle mt-1">
                  {(() => {
                    const data = (confirmMutation.error as { response?: { data?: unknown } })?.response?.data
                    if (typeof data === 'string' && data.length > 0) return data
                    return 'The link may have expired or already been used.'
                  })()}
                </p>
              </div>
              <Link href="/login"><Button fullWidth variant="secondary">Go to sign in</Button></Link>
            </>
          ) : null }
        </div>
      </div>
    </div>
  )
}
