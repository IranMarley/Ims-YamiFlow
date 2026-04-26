'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../lib/publicApi'
import { BASE_URL } from '../../lib/axios'
import PublicHeader from '../../components/layout/PublicHeader'
import type { Course, PagedResult } from '../../types/course'

// ── Mappings ─────────────────────────────────────────────

const LEVEL_MAP: Record<number, string> = {
  0: 'Beginner',
  1: 'Intermediate',
  2: 'Advanced'
}

const STATUS_MAP: Record<number, string> = {
  0: 'Draft',
  1: 'Published',
  2: 'Archived'
}

function normalizeCourse(raw: any): Course {
  return {
    ...raw,
    level: LEVEL_MAP[raw.level] ?? raw.level,
    status: STATUS_MAP[raw.status] ?? raw.status
  }
}

// ── API ────────────────────────────────────────────────

function usePublicCourses(params: { search?: string; level?: string; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ['public-courses', params],
    queryFn: async () => {
      const res = await publicApi.get<PagedResult<Course>>('/api/courses', {
        params: { ...params, page: 1 }
      })
      return { ...res.data, items: res.data.items.map(normalizeCourse) }
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ── Constants ─────────────────────────────────────────────

const LEVEL_COLOR: Record<string, string> = {
  Beginner: 'bg-success/15 text-success',
  Intermediate: 'bg-warning/15 text-warning',
  Advanced: 'bg-danger/15 text-danger',
}

const gradients = [
  'from-violet-500/30 via-primary/20 to-background',
  'from-blue-500/30 via-cyan-500/20 to-background',
  'from-emerald-500/30 via-success/20 to-background',
  'from-orange-500/30 via-warning/20 to-background',
]


// ── Card ─────────────────────────────────────────────────

function CourseCard({ course, index }: { course: Course; index: number }) {
  const router = useRouter()
  const g = gradients[index % gradients.length]

  return (
    <article
      onClick={() => router.push(`/courses/${course.courseId}`)}
      className="bg-surface border border-border rounded-2xl overflow-hidden cursor-pointer
        hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1.5
        transition-all duration-300 group flex flex-col"
    >
      <div className={`h-48 bg-gradient-to-br ${g} flex items-center justify-center overflow-hidden relative`}>
        {course.thumbnail ? (
          <img
            src={`${BASE_URL}${course.thumbnail}`}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-white/20 text-5xl group-hover:scale-110 transition-transform duration-500">▶</div>
        )}
        {course.isFree && (
          <span className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-success/90 text-background">
            Free
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-center justify-between">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${LEVEL_COLOR[course.level] ?? 'bg-border text-subtle'}`}>
            {course.level}
          </span>
          {!course.isFree && (
            <span className="text-xs font-semibold text-primary">Premium</span>
          )}
        </div>

        <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {course.title}
        </h3>

        <p className="text-xs text-subtle line-clamp-2 leading-relaxed flex-1">
          {course.description}
        </p>

        <div className="flex items-center gap-2 pt-1 border-t border-border/60">
          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">
            {course.instructorName?.[0]?.toUpperCase() ?? 'I'}
          </div>
          <p className="text-xs text-subtle truncate">{course.instructorName}</p>
        </div>
      </div>
    </article>
  )
}

function CourseCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="h-48 bg-border/40 animate-pulse" />
      <div className="p-5 flex flex-col gap-3">
        <div className="h-4 w-20 bg-border/40 rounded-full animate-pulse" />
        <div className="h-4 w-full bg-border/40 rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-border/40 rounded animate-pulse" />
        <div className="h-3 w-full bg-border/40 rounded animate-pulse" />
        <div className="h-3 w-2/3 bg-border/40 rounded animate-pulse" />
      </div>
    </div>
  )
}

// ── Landing ──────────────────────────────────────────────

export default function LandingPage() {
  const [level, setLevel] = useState<string | undefined>(undefined)
  const { data, isLoading } = usePublicCourses({ level, pageSize: 6 })

  return (
    <div className="min-h-screen bg-background text-text">
      <PublicHeader />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-32">
        {/* Background orbs */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-primary/5 blur-[80px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Start free — no credit card required
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
            Skills that move your
            <span className="block bg-gradient-to-r from-primary via-violet-400 to-blue-400 bg-clip-text text-transparent mt-2">
              career forward
            </span>
          </h1>

          <p className="text-subtle text-lg max-w-2xl mx-auto mt-8 leading-relaxed">
            Practical, project-based courses built for developers and builders.
            Start with free content — upgrade when you&apos;re ready to go deeper.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
            <Link
              href="/courses"
              className="px-8 py-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:shadow-primary/30"
            >
              Browse free courses
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 border border-border hover:border-primary/50 hover:bg-surface text-text rounded-xl font-semibold text-sm transition-all duration-200"
            >
              View premium plans
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center items-center gap-6 mt-14 text-xs text-subtle">
            {[
              '✓ Free courses always available',
              '✓ Cancel subscription anytime',
              '✓ Verified completion certificates',
            ].map((t) => (
              <span key={t} className="flex items-center gap-1">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── COURSES ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-16 border-t border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-bold">Featured courses</h2>
            <p className="text-subtle mt-2 text-sm">Handpicked by our team. Start today.</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {[
              { label: 'All', value: undefined },
              { label: 'Beginner', value: 'Beginner' },
              { label: 'Intermediate', value: 'Intermediate' },
              { label: 'Advanced', value: 'Advanced' },
            ].map(({ label, value }) => (
              <button
                key={label}
                onClick={() => setLevel(value)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                  level === value
                    ? 'bg-primary text-white'
                    : 'bg-surface border border-border text-subtle hover:text-text hover:border-primary/30'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <CourseCardSkeleton key={i} />)
            : data?.items.length
              ? data.items.map((c, i) => <CourseCard key={c.courseId} course={c} index={i} />)
              : (
                <div className="col-span-3 text-center py-16 text-subtle">
                  No courses found for this level.
                </div>
              )
          }
        </div>

        <div className="text-center mt-12">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-7 py-3 border border-border hover:border-primary/40 hover:bg-surface rounded-xl text-sm font-medium transition-all duration-200"
          >
            View all courses
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="border-t border-border bg-surface/30">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-bold text-text">YamiFlow</span>
          </div>

          <nav className="flex flex-wrap justify-center gap-6 text-xs text-subtle">
            <Link href="/courses" className="hover:text-text transition-colors">Courses</Link>
            <Link href="/pricing" className="hover:text-text transition-colors">Pricing</Link>
            <Link href="/login" className="hover:text-text transition-colors">Log in</Link>
            <Link href="/register" className="hover:text-text transition-colors">Sign up</Link>
          </nav>

          <p className="text-xs text-subtle">
            © {new Date().getFullYear()} YamiFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
