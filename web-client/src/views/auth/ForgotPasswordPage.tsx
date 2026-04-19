'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useForgotPassword } from '../../hooks/useAuth'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const mutation = useForgotPassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = ({ email }: FormData) => {
    mutation.mutate(email)
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
            Enter your email and we'll send you a reset link
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
                If an account exists for that email, you'll receive a password reset link shortly.
              </p>
              <Link
                href="/login"
                className="inline-block mt-2 text-sm text-primary hover:text-primary-hover font-medium transition-colors"
              >
                Back to sign in
              </Link>
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
