'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Header from '../../components/layout/Header'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { useChangePassword } from '../../hooks/useAuth'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export default function ChangePasswordPage() {
  const mutation = useChangePassword()
  const [successMessage, setSuccessMessage] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = (data: FormData) => {
    mutation.mutate(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      {
        onSuccess: () => {
          setSuccessMessage('Password changed successfully.')
          reset()
        },
      },
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <Link
            href="/account/profile"
            className="inline-flex items-center gap-1.5 text-sm text-subtle hover:text-text transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to profile
          </Link>
          <h1 className="text-3xl font-bold text-text">Change Password</h1>
          <p className="text-subtle mt-1">Update your account password</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm">
          {successMessage ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-text font-medium">{successMessage}</p>
              <Button variant="secondary" onClick={() => setSuccessMessage('')}>
                Change again
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <Input
                label="Current password"
                type="password"
                placeholder="Enter your current password"
                autoComplete="current-password"
                registration={register('currentPassword')}
                error={errors.currentPassword?.message}
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
                placeholder="Repeat new password"
                autoComplete="new-password"
                registration={register('confirmPassword')}
                error={errors.confirmPassword?.message}
              />

              {mutation.isError && (
                <div className="rounded-xl bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
                  {(mutation.error as { response?: { data?: string } })?.response?.data ??
                    'Failed to change password. Please check your current password.'}
                </div>
              )}

              <Button type="submit" fullWidth size="lg" loading={mutation.isPending}>
                Change password
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
