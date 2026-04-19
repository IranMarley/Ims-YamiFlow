import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '../../components/layout/Header'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { usePostDetail, useReplyToPost } from '../../hooks/useForum'

export default function ForumPostPage() {
  const params = useParams()
  const postId = (params?.id as string) ?? ''
  const router = useRouter()
  const [replyBody, setReplyBody] = useState('')

  const { data: post, isLoading } = usePostDetail(postId)
  const replyMutation = useReplyToPost(postId)

  const handleReply = () => {
    if (!replyBody.trim()) return
    replyMutation.mutate(replyBody, {
      onSuccess: () => setReplyBody(''),
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <h2 className="text-xl font-semibold text-text mb-2">Post not found</h2>
          <Button onClick={() => router.push('/forum')}>Back to Forum</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <button
          onClick={() => router.push('/forum')}
          className="flex items-center gap-2 text-sm text-subtle hover:text-text transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Forum
        </button>

        {/* Original post */}
        <Card className="mb-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-text leading-snug">{post.title}</h1>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-sm text-subtle">By {post.authorName}</span>
                <span className="text-xs text-subtle/60">
                  {new Date(post.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
          <p className="text-text text-sm leading-relaxed whitespace-pre-wrap">{post.body}</p>
        </Card>

        {/* Replies */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-text mb-4">
            {post.replies.length} {post.replies.length === 1 ? 'Reply' : 'Replies'}
          </h2>

          {post.replies.length === 0 ? (
            <p className="text-subtle text-sm py-6 text-center">No replies yet. Be the first to reply!</p>
          ) : (
            <div className="space-y-3">
              {post.replies.map((reply) => (
                <Card key={reply.replyId} className="bg-surface/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {reply.authorName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-text">{reply.authorName}</span>
                      <span className="text-xs text-subtle ml-2">
                        {new Date(reply.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-subtle leading-relaxed whitespace-pre-wrap pl-10">{reply.body}</p>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Reply form */}
        <Card>
          <h3 className="font-semibold text-text mb-3">Leave a reply</h3>
          <textarea suppressHydrationWarning
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            rows={4}
            placeholder="Write your reply..."
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-subtle/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 resize-none transition-all"
          />
          <div className="flex gap-2 mt-3">
            <Button
              loading={replyMutation.isPending}
              disabled={!replyBody.trim()}
              onClick={handleReply}
            >
              Post Reply
            </Button>
          </div>
        </Card>
      </main>
    </div>
  )
}
