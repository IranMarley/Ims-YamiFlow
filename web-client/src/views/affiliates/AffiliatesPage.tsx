'use client'
import { useState } from 'react'
import Header from '../../components/layout/Header'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

interface StatCardProps {
  label: string
  value: string
  icon: React.ReactNode
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <Card className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-text">{value}</p>
        <p className="text-sm text-subtle">{label}</p>
      </div>
    </Card>
  )
}

export default function AffiliatesPage() {
  const [toastMessage, setToastMessage] = useState('')

  const handleGenerateLink = () => {
    setToastMessage('Affiliate link generation coming soon!')
    setTimeout(() => setToastMessage(''), 3500)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text">Affiliate Program</h1>
          <p className="text-subtle mt-1">Earn commissions by referring new learners</p>
        </div>

        {toastMessage && (
          <div className="mb-6 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 text-sm text-primary">
            {toastMessage}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Total Clicks"
            value="0"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            }
          />
          <StatCard
            label="Conversions"
            value="0"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            }
          />
          <StatCard
            label="Total Earnings"
            value="$0.00"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Affiliate links table */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden mb-5">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">Your Affiliate Links</h2>
            <Button size="sm" onClick={handleGenerateLink}>
              Generate Link
            </Button>
          </div>

          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-text mb-1">No affiliate links yet</h3>
            <p className="text-sm text-subtle">Generate your first link to start earning commissions.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
