'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Header from '../../components/layout/Header'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Input from '../../components/ui/Input'
import { useForumPosts, useCreatePost } from '../../hooks/useForum'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  body: z.string().min(1, 'Message body is required').max(10000),
})

type FormData = z.infer<typeof schema>

export default function ForumPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const pageSize = 20

  const { data, isLoading } = useForumPosts({ page, pageSize })
  const createPostMutation = useCreatePost()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = (formData: FormData) => {
    createPostMutation.mutate(
      { title: formData.title, body: formData.body },
      {
        onSuccess: () => {
          reset()
          setShowForm(false)
        },
      },
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text">Community Forum</h1>
            {data && (
              <p className="text-subtle mt-1">
                {data.totalCount} post{data.totalCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            New post
          </Button>
        </div>

        {/* New post form */}
        {showForm && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-text mb-4">Create a post</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input
                label="Title"
                placeholder="What's on your mind?"
                registration={register('title')}
                error={errors.title?.message}
              />
              <div>
                <label className="block text-sm font-medium text-text mb-1">Message</label>
                <textarea suppressHydrationWarning
                  rows={5}
                  placeholder="Describe your question or share your thoughts..."
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-subtle/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 resize-none transition-all"
                  {...register('body')}
                />
                {errors.body && (
                  <p className="text-xs text-danger mt-1">{errors.body.message}</p>
                )}
              </div>

              {createPostMutation.isError && (
                <div className="rounded-xl bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
                  Failed to create post. Please try again.
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" loading={createPostMutation.isPending}>
                  Post
                </Button>
                <Button type="button" variant="secondary" onClick={() => { setShowForm(false); reset() }}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Posts list */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : data?.items.length === 0 ? (
          <EmptyState
            title="No posts yet"
            description="Start the conversation by creating the first post."
            action={{ label: 'New post', onClick: () => setShowForm(true) }}
          />
        ) : (
          <div className="space-y-3">
            {data?.items.map((post) => (
              <Card
                key={post.postId}
                hover
                onClick={() => router.push(`/forum/posts/${post.postId}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text line-clamp-1">{post.title}</h3>
                    <p className="text-sm text-subtle line-clamp-2 mt-0.5">{post.bodyPreview}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-subtle">By {post.authorName}</span>
                      <span className="text-xs text-subtle/60">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5 text-subtle text-xs">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {post.replyCount}
                  </div>
                </div>
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
