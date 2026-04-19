'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuthStore } from '../../store/authStore'
import { useLogout } from '../../hooks/useAuth'

export default function PublicHeader() {
  const user = useAuthStore((s) => s.user)
  const logoutMutation = useLogout()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U'

  const isAdmin = user?.role === 'Admin'
  const isInstructor = user?.role === 'Instructor'
  const isStudent = user?.role === 'Student'


  return (
  <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={isInstructor ? '/instructor' : isAdmin || isStudent ? '/dashboard' : '/'} className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-lg font-bold text-text group-hover:text-primary transition-colors">
              YamiFlow
            </span>
          </Link>

          {/* Nav */}
          <nav className="hidden sm:flex items-center gap-6">
            {isStudent && (
              <>
                <Link href="/dashboard" className="text-sm font-medium text-subtle hover:text-text transition-colors">Dashboard</Link>
                <Link href="/courses" className="text-sm font-medium text-subtle hover:text-text transition-colors">Courses</Link>
                <Link href="/enrollments/my" className="text-sm font-medium text-subtle hover:text-text transition-colors">My Learning</Link>
              </>
            )}
          </nav>

          {/* Auth actions */}
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-surface-hover transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold">
                    {initials}
                  </div>
                  <span className="hidden md:block text-sm text-text max-w-[120px] truncate">
                    {user?.fullName || user?.email}
                  </span>
                  <svg className="w-4 h-4 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-2xl shadow-xl py-1 z-50">
                    <div className="px-4 py-2.5 border-b border-border">
                      <p className="text-xs font-medium text-text truncate">{user.fullName || '—'}</p>
                      <p className="text-xs text-subtle truncate">{user.email}</p>
                    </div>
                    {/* Instructors use the logo to access their dashboard; show dashboard/my learning for others */}
                    {!isInstructor && (
                      <>
                        <Link
                          href="/dashboard"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-text hover:bg-surface-hover transition-colors"
                        >
                          Dashboard
                        </Link>
                        <Link
                          href="/enrollments/my"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-text hover:bg-surface-hover transition-colors"
                        >
                          My Learning
                        </Link>
                      </>
                    )}
                    <div className="border-t border-border mt-1">
                      <button
                        onClick={() => { setMenuOpen(false); logoutMutation.mutate() }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-text hover:text-primary transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium bg-primary hover:bg-primary-hover text-white rounded-xl transition-colors"
                >
                  Sign up free
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
