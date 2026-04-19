import type { CourseLevel } from '../../types/course'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'level'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  level?: CourseLevel
  className?: string
}

const variantClasses: Record<Exclude<BadgeVariant, 'level'>, string> = {
  default: 'bg-border/50 text-subtle',
  primary: 'bg-primary/15 text-primary',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
}

const levelClasses: Record<CourseLevel, string> = {
  Beginner: 'bg-success/15 text-success',
  Intermediate: 'bg-warning/15 text-warning',
  Advanced: 'bg-danger/15 text-danger',
}

export default function Badge({
  children,
  variant = 'default',
  level,
  className = '',
}: BadgeProps) {
  const classes =
    variant === 'level' && level
      ? levelClasses[level]
      : variantClasses[variant as Exclude<BadgeVariant, 'level'>]

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5
        text-xs font-medium rounded-full
        ${classes}
        ${className}
      `}
    >
      {children}
    </span>
  )
}
