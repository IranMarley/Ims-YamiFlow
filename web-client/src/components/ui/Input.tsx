import React, { useState } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  registration?: UseFormRegisterReturn
  // When true and type is password, show a toggle button to reveal/hide the password
  showToggle?: boolean
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
  showToggle = false,
  ...props
}: InputProps) {
  const inputId = id ?? registration?.name
  const [show, setShow] = useState(false)

  const actualType = props.type === 'password' && show ? 'text' : props.type

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
            ${rightIcon || showToggle ? 'pr-10' : ''}
            ${className}
          `}
          {...registration}
          {...props}
          type={actualType}
        />

        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle">
            {rightIcon}
          </span>
        )}

        {showToggle && props.type === 'password' && (
          <button
            type="button"
            aria-label={show ? 'Hide password' : 'Show password'}
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle cursor-pointer hover:text-text"
          >
            {show ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7 1.08-2.09 2.79-3.86 4.78-5.05" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.22 6.22L17.78 17.78" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.98 12.72A10 10 0 0112 7c5 0 9.27 3.11 11 7-1.08 2.09-2.79 3.86-4.78 5.05" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
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
