'use client'
import { Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useResetPassword } from '../../hooks/useAuth'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const schema = z
  .object({
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams?.get('token') ?? ''
  const mutation = useResetPassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = ({ email, newPassword }: FormData) => {
    mutation.mutate({ email, token, newPassword })
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 text-center space-y-4">
          <p className="text-danger font-medium">Invalid or expired reset link.</p>
          <Link href="/forgot-password" className="text-sm text-primary hover:text-primary-hover font-medium transition-colors">
            Request a new one
          </Link>
        </div>
      </div>
    )
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
          <h1 className="text-2xl font-bold text-text">Set new password</h1>
          <p className="text-sm text-subtle mt-1">Choose a strong password for your account</p>
        </div>

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

            <Input
              label="New password"
              type="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              registration={register('newPassword')}
              error={errors.newPassword?.message}
            />

            <Input
              label="Confirm new password"
              type="password"
              placeholder="Repeat your new password"
              autoComplete="new-password"
              registration={register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />

            {mutation.isError && (
              <div className="rounded-xl bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
                The reset link may have expired. Please request a new one.
              </div>
            )}

            <Button type="submit" fullWidth size="lg" loading={mutation.isPending}>
              Reset password
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
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
