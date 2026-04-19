'use client'
import { useState } from 'react'
import Header from '../../components/layout/Header'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../../hooks/useNotifications'

export default function NotificationsPage() {
  const [page, setPage] = useState(1)
  const pageSize = 20

  const { data, isLoading } = useNotifications(page, pageSize)
  const markReadMutation = useMarkNotificationRead()
  const markAllReadMutation = useMarkAllNotificationsRead()

  const unreadCount = data?.items.filter((n) => !n.isRead).length ?? 0

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-subtle mt-1">{unreadCount} unread</p>
            )}
          </div>

          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              loading={markAllReadMutation.isPending}
              onClick={() => markAllReadMutation.mutate()}
            >
              Mark all as read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : data?.items.length === 0 ? (
          <EmptyState
            title="No notifications yet"
            description="You're all caught up! Check back later for updates."
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            }
          />
        ) : (
          <div className="space-y-2">
            {data?.items.map((notification) => (
              <Card
                key={notification.notificationId}
                className={`transition-all ${notification.isRead ? 'opacity-60' : 'border-primary/30'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                      notification.isRead ? 'bg-border' : 'bg-primary'
                    }`} />
                    <div className="min-w-0">
                      <p className="font-medium text-text">{notification.title}</p>
                      <p className="text-sm text-subtle mt-0.5">{notification.body}</p>
                      <p className="text-xs text-subtle/60 mt-1">
                        {new Date(notification.createdAt).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={
                        markReadMutation.isPending &&
                        markReadMutation.variables === notification.notificationId
                      }
                      onClick={() => markReadMutation.mutate(notification.notificationId)}
                    >
                      Mark read
                    </Button>
                  )}
                </div>
              </Card>
            ))}

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-6">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-subtle">
                  Page {page} of {data.totalPages}
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
