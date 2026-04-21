'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '../../store/authStore'
import { useLogout } from '../../hooks/useAuth'

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')
  return (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors duration-150 ${
        isActive ? 'text-primary' : 'text-subtle hover:text-text'
      }`}
    >
      {children}
    </Link>
  )
}

export default function Header() {
  const user = useAuthStore((s) => s.user)
  const logoutMutation = useLogout()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isAdmin = user?.role === 'Admin'
  const isInstructor = user?.role === 'Instructor'
  const isStudent = user?.role === 'Student'

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U'

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
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

          <nav className="hidden sm:flex items-center gap-6">
            {isStudent && (
              <>
                <NavLink href="/dashboard">Dashboard</NavLink>
                <NavLink href="/courses">Courses</NavLink>
                <NavLink href="/enrollments/my">My Learning</NavLink>
              </>
            )}
          </nav>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-surface-hover transition-colors cursor-pointer"
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
              <div className="absolute right-0 mt-2 w-52 bg-surface border border-border rounded-2xl shadow-xl py-1 z-50">
                <div className="px-4 py-2.5 border-b border-border">
                  <p className="text-xs font-medium text-text truncate">{user?.fullName || '—'}</p>
                  <p className="text-xs text-subtle truncate">{user?.email}</p>
                  {user?.role && (
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {user.role}
                    </span>
                  )}
                </div>

                <Link
                  href="/account/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Edit my profile
                </Link>

                <Link
                  href="/account/change-password"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Change password
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-surface-hover transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Admin panel
                  </Link>
                )}

                <div className="border-t border-border mt-1">
                  <button
                    onClick={() => { setMenuOpen(false); logoutMutation.mutate() }}
                    disabled={logoutMutation.isPending}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex sm:hidden items-center gap-4 pb-3 overflow-x-auto">
          {!isInstructor && (
            <>
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/courses">Courses</NavLink>
              <NavLink href="/enrollments/my">My Learning</NavLink>
            </>
          )}
          {isAdmin && <NavLink href="/admin">Admin</NavLink>}
        </nav>
      </div>
    </header>
  )
}
