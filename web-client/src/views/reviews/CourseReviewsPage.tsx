'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Header from '../../components/layout/Header'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { useCourseReviews, useCreateReview } from '../../hooks/useReviews'

const schema = z.object({
  rating: z.coerce.number().int().min(1, 'Rating required').max(5),
  comment: z.string().min(1, 'Comment is required').max(2000),
})

type FormData = z.infer<typeof schema>

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`w-8 h-8 transition-colors ${star <= value ? 'text-warning' : 'text-border hover:text-warning/60'}`}
        >
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </button>
      ))}
    </div>
  )
}

export default function CourseReviewsPage() {
  const params = useParams(); const courseId = (params?.id as string) ?? ''
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [rating, setRating] = useState(0)
  const [showForm, setShowForm] = useState(false)

  const { data, isLoading } = useCourseReviews(courseId, page, pageSize)
  const createReviewMutation = useCreateReview(courseId)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = (formData: FormData) => {
    createReviewMutation.mutate(
      { rating: formData.rating, comment: formData.comment },
      {
        onSuccess: () => {
          reset()
          setRating(0)
          setShowForm(false)
        },
      },
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text">Course Reviews</h1>
            {data && (
              <p className="text-subtle mt-1">
                {data.totalCount} review{data.totalCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            Write a review
          </Button>
        </div>

        {/* Review form */}
        {showForm && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-text mb-4">Your review</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Rating</label>
                <StarRating value={rating} onChange={setRating} />
                <input suppressHydrationWarning type="hidden" value={rating} {...register('rating')} />
                {errors.rating && (
                  <p className="text-xs text-danger mt-1">{errors.rating.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">Comment</label>
                <textarea suppressHydrationWarning
                  rows={4}
                  placeholder="Share your thoughts about this course..."
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-subtle/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 resize-none transition-all"
                  {...register('comment')}
                />
                {errors.comment && (
                  <p className="text-xs text-danger mt-1">{errors.comment.message}</p>
                )}
              </div>

              {createReviewMutation.isError && (
                <div className="rounded-xl bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
                  Failed to submit review. Please try again.
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" loading={createReviewMutation.isPending}>
                  Submit review
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { setShowForm(false); reset(); setRating(0) }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Reviews list */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : data?.items.length === 0 ? (
          <EmptyState
            title="No reviews yet"
            description="Be the first to review this course."
            action={{ label: 'Write a review', onClick: () => setShowForm(true) }}
          />
        ) : (
          <div className="space-y-4">
            {data?.items.map((review) => (
              <Card key={review.reviewId}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-text">{review.studentName}</p>
                    <div className="flex gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-4 h-4 ${star <= review.rating ? 'text-warning' : 'text-border'}`}
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-subtle">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-subtle">{review.comment}</p>
              </Card>
            ))}

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-subtle">
                  {page} / {data.totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
