'use client'
import { useRouter } from 'next/navigation'
import Header from '../../components/layout/Header'
import Button from '../../components/ui/Button'

export default function PaymentsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text">Payment History</h1>
          <p className="text-subtle mt-1">View all your past transactions</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <div className="grid grid-cols-4 gap-4">
              <span className="text-sm font-medium text-subtle">Date</span>
              <span className="text-sm font-medium text-subtle">Description</span>
              <span className="text-sm font-medium text-subtle">Amount</span>
              <span className="text-sm font-medium text-subtle">Status</span>
            </div>
          </div>

          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text mb-1">No payments yet</h3>
            <p className="text-sm text-subtle mb-6">Enroll in a paid course to see your transactions here.</p>
            <Button onClick={() => router.push('/courses')}>
              Browse courses
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
