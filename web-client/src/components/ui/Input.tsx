import type { InputHTMLAttributes, ReactNode } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  registration?: UseFormRegisterReturn
}

export default function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  registration,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id ?? registration?.name

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-text"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none">
            {leftIcon}
          </span>
        )}

        <input
          id={inputId}
          className={`
            w-full rounded-xl border bg-surface text-text placeholder:text-subtle
            px-4 py-2.5 text-sm
            transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error
              ? 'border-danger focus:ring-danger'
              : 'border-border hover:border-subtle'
            }
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${className}
          `}
          {...registration}
          {...props}
        />

        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle">
            {rightIcon}
          </span>
        )}
      </div>

      {error && (
        <p className="text-xs text-danger flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.5zm0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
          </svg>
          {error}
        </p>
      )}

      {hint && !error && (
        <p className="text-xs text-subtle">{hint}</p>
      )}
    </div>
  )
}
