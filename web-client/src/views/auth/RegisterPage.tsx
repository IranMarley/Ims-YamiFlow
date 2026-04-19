'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRegister } from '../../hooks/useAuth'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(80, 'Full name is too long'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const registerMutation = useRegister()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })

  const onSubmit = ({ fullName, email, password }: RegisterFormData) => {
    registerMutation.mutate({ fullName, email, password })
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
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
          <h1 className="text-2xl font-bold text-text">Start learning today</h1>
          <p className="text-sm text-subtle mt-1">Create your free YamiFlow account</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8 shadow-xl">
          {registerMutation.isSuccess ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-success/15 flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text">Account created!</h3>
                <p className="text-sm text-subtle mt-1">
                  Check your inbox to confirm your email, then sign in.
                </p>
              </div>
              <Link href="/login">
                <Button fullWidth>Go to sign in</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <Input
                label="Full name"
                type="text"
                placeholder="Jane Smith"
                autoComplete="name"
                registration={register('fullName')}
                error={errors.fullName?.message}
              />
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                registration={register('email')}
                error={errors.email?.message}
              />
              <Input
                label="Password"
                type="password"
                placeholder="Min. 8 characters, 1 uppercase, 1 number"
                autoComplete="new-password"
                registration={register('password')}
                error={errors.password?.message}
              />
              <Input
                label="Confirm password"
                type="password"
                placeholder="Repeat your password"
                autoComplete="new-password"
                registration={register('confirmPassword')}
                error={errors.confirmPassword?.message}
              />

              {registerMutation.isError && (
                <div className="rounded-xl bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
                  {(registerMutation.error as { response?: { data?: { message?: string } } })
                    ?.response?.data?.message ?? 'Registration failed. Please try again.'}
                </div>
              )}

              <Button type="submit" fullWidth size="lg" loading={registerMutation.isPending}>
                Create account
              </Button>
            </form>
          )}

          {!registerMutation.isSuccess && (
            <p className="mt-6 text-center text-sm text-subtle">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:text-primary-hover font-medium transition-colors">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
