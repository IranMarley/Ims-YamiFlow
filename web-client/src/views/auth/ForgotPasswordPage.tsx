'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useForgotPassword } from '../../hooks/useAuth'
import { useState, useEffect } from 'react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import useRedirectIfAuthenticated from '../../hooks/useAuthRedirect'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const mutation = useForgotPassword()
  useRedirectIfAuthenticated()
  const [formError, setFormError] = useState<string | null>(null)

  // read email from URL querystring on client (avoid Next prerender issues with useSearchParams)
  const prefillEmail = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('email') ?? '' : ''

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { email: prefillEmail || undefined } })

  // ensure the email field shows the querystring value on client mount
  useEffect(() => {
    if (prefillEmail) setValue('email', prefillEmail)
  }, [prefillEmail, setValue])

  const onSubmit = ({ email }: FormData) => {
    setFormError(null)
    mutation.mutate(email, {
      onError: (err: unknown) => {
        const data = (err as unknown as { response?: { data?: unknown } })?.response?.data
        if (data && typeof data === 'object') {
          const maybe = data as Record<string, unknown>
          // Backend validation format: { errors: { field: message } }
          if (maybe.errors && typeof maybe.errors === 'object') {
            Object.entries(maybe.errors as Record<string, unknown>).forEach(([field, msg]) => {
              try {
                setError(field as keyof FormData, { type: 'server', message: String(msg) })
              } catch {
                setFormError(String(msg))
              }
            })
            return
          }

          if (typeof maybe.message === 'string') {
            if ((maybe.message as string).toLowerCase().includes('email')) {
              setError('email', { type: 'server', message: maybe.message as string })
            } else {
              setFormError(maybe.message as string)
            }
            return
          }
        }

        if (typeof data === 'string' && data.length > 0) {
          setFormError(data)
        } else {
          setFormError('Something went wrong. Please try again.')
        }
      },
    })
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/30 mb-4">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text">Forgot password?</h1>
          <p className="text-sm text-subtle mt-1 text-center">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8 shadow-xl">
          {mutation.isSuccess ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-text font-medium">Check your inbox</p>
              <p className="text-sm text-subtle">
                If an account exists for that email, you&apos;ll receive a password reset link shortly.
              </p>
              <Link
                href="/login"
                className="inline-block mt-2 text-sm text-primary hover:text-primary-hover font-medium transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          ) : mutation.isPending ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
                <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8" />
                </svg>
              </div>
              <p className="text-text font-medium">Sending reset link…</p>
              <p className="text-sm text-subtle">Please wait a moment.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <Input
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  registration={register('email')}
                  error={errors.email?.message}
                />

              {mutation.isError && (
                <div className="rounded-xl bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
                  Something went wrong. Please try again.
                </div>
              )}
                {formError && (
                  <div className="rounded-xl bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
                    {formError}
                  </div>
                )}

              <Button type="submit" fullWidth size="lg" loading={mutation.isPending}>
                Send reset link
              </Button>

              <p className="text-center text-sm text-subtle">
                Remember your password?{' '}
                <Link
                  href="/login"
                  className="text-primary hover:text-primary-hover font-medium transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
