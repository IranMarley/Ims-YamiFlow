'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useLogin, useResendConfirmation } from '../../hooks/useAuth'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { useRouter, useSearchParams } from 'next/navigation'
import useRedirectIfAuthenticated from '../../hooks/useAuthRedirect'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? undefined
  const loginMutation = useLogin(redirectTo)
  const resendMutation = useResendConfirmation()
  const router = useRouter()
  useRedirectIfAuthenticated()

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })


  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data)
  }

  const serverError = (() => {
    const data = (loginMutation.error as { response?: { data?: unknown } })?.response?.data
    if (typeof data === 'string' && data.length > 0) return data
    if (data && typeof data === 'object' && 'message' in data) return String((data as { message: unknown }).message)
    return loginMutation.isError ? 'Invalid email or password. Please try again.' : null
  })()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Back to home */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-subtle hover:text-text transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to home
          </Link>
        </div>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/30 mb-4">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text">Welcome back</h1>
          <p className="text-sm text-subtle mt-1">Sign in to continue learning</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              registration={register('email')}
              error={errors.email?.message}
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-subtle">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    const emailValue = getValues('email')
                    const href = emailValue ? `/forgot-password?email=${encodeURIComponent(emailValue)}` : '/forgot-password'
                    router.push(href)
                  }}
                  className="text-xs text-primary hover:text-primary-hover transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                type="password"
                showToggle
                placeholder="Enter your password"
                autoComplete="current-password"
                registration={register('password')}
                error={errors.password?.message}
              />
            </div>

            {serverError && (
              <div className="rounded-xl bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger space-y-2">
                <p>{serverError}</p>
                {serverError.toLowerCase().includes('confirm') && (
                  <button
                    type="button"
                    onClick={() => resendMutation.mutate(getValues('email'))}
                    disabled={resendMutation.isPending || resendMutation.isSuccess}
                    className="underline underline-offset-2 text-danger/80 hover:text-danger disabled:opacity-50 transition-colors"
                  >
                    {resendMutation.isPending ? 'Sending…' : resendMutation.isSuccess ? 'Email sent!' : 'Resend confirmation email'}
                  </button>
                )}
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loginMutation.isPending}
            >
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-subtle">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-primary hover:text-primary-hover font-medium transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
