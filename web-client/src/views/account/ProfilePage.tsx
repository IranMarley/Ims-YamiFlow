'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '../../components/layout/Header'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { useProfile, useUpdateProfile } from '../../hooks/useProfile'

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile()
  const updateMutation = useUpdateProfile()

  const [fullName, setFullName] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName ?? '')
    }
  }, [profile])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage('')
    updateMutation.mutate(fullName, {
      onSuccess: () => {
        setSuccessMessage('Profile updated successfully.')
      },
    })
  }

  const initials = profile?.fullName
    ? profile.fullName
        .split(' ')
      .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : profile?.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text">My Profile</h1>
          <p className="text-subtle mt-1">Manage your account information</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-8">
            {isLoading ? (
              <div className="w-20 h-20 rounded-full skeleton" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
                {initials}
              </div>
            )}
            {!isLoading && profile && (
              <p className="mt-3 text-subtle text-sm">{profile.email}</p>
            )}
          </div>

          {successMessage && (
            <div className="mb-5 rounded-xl bg-success/10 border border-success/20 px-4 py-3 text-sm text-success flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {successMessage}
            </div>
          )}

          {updateMutation.isError && (
            <div className="mb-5 rounded-xl bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
              Failed to update profile. Please try again.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Read-only email */}
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Email address</label>
              <div className="w-full px-4 py-3 rounded-xl bg-background border border-border text-subtle text-sm">
                {isLoading ? (
                  <span className="inline-block w-48 h-4 skeleton rounded" />
                ) : (
                  profile?.email ?? ''
                )}
              </div>
              <p className="mt-1 text-xs text-subtle">Email cannot be changed.</p>
            </div>

            {/* Editable full name */}
            <Input
              label="Full name"
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={updateMutation.isPending}
              disabled={isLoading || !fullName.trim()}
            >
              Save changes
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <Link
              href="/account/change-password"
              className="flex items-center gap-2 text-sm text-subtle hover:text-text transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Change password
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
