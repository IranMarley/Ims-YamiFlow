'use client'
import Header from '../../components/layout/Header'

export default function QuizzesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text">Quizzes</h1>
          <p className="text-subtle mt-1">Test your knowledge with interactive quizzes</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Empty state */}
          <div className="col-span-full py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text mb-1">No quizzes available yet</h3>
            <p className="text-sm text-subtle">Quizzes will appear here once courses add them. Check back soon!</p>
          </div>
        </div>
      </main>
    </div>
  )
}
