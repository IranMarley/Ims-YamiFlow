import type { ReactNode } from 'react'
import Button from './Button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {icon ? (
        <div className="mb-4 text-subtle opacity-60">{icon}</div>
      ) : (
        <div className="mb-4 w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center text-subtle">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      )}

      <h3 className="text-lg font-semibold text-text mb-2">{title}</h3>

      {description && (
        <p className="text-sm text-subtle max-w-sm mb-6">{description}</p>
      )}

      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  )
}
