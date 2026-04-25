'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../lib/publicApi'
import { useAuthStore } from '../../store/authStore'
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

// ── UI ────────────────────────────────────────────────

function StarRating({ value = 4.7 }: { value?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i}
          className={`w-3.5 h-3.5 ${i <= Math.round(value) ? 'text-warning' : 'text-border'}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
      <span className="text-xs text-warning font-semibold ml-1">{value.toFixed(1)}</span>
    </div>
  )
}

const LEVEL_COLOR: Record<string,string> = {
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

// ── Card ────────────────────────────────────────────────

function CourseCard({ course, index }: any) {
  const router = useRouter()
  const g = gradients[index % gradients.length]

  return (
    <article
      onClick={() => router.push(`/courses/${course.courseId}`)}
      className="bg-surface border border-border rounded-2xl overflow-hidden cursor-pointer
      hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
    >
      <div className={`h-44 bg-gradient-to-br ${g} flex items-center justify-center`}>
        <div className="text-white/30 text-4xl group-hover:scale-110 transition-transform">▶</div>
      </div>

      <div className="p-4 flex flex-col gap-2">
        <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">
          {course.title}
        </h3>

        <p className="text-xs text-subtle">{course.instructorName}</p>

        <StarRating />

        <p className="text-xs text-subtle line-clamp-2">
          {course.description}
        </p>

        <div className="flex justify-between items-center mt-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${LEVEL_COLOR[course.level]}`}>
            {course.level}
          </span>

          {course.isFree ? (
            <span className="text-sm font-bold text-success">Free</span>
          ) : (
            <span className="text-sm font-bold text-primary">Premium</span>
          )}
        </div>
      </div>
    </article>
  )
}

// ── Landing ─────────────────────────────────────────────

export default function LandingPage() {
  const [level, setLevel] = useState<string | undefined>(undefined)

  const { data, isLoading } = usePublicCourses({ level, pageSize: 8 })

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* HERO */}
      <section className="relative text-center py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-violet-500/10" />

        <h1 className="text-6xl font-bold relative">
          Learn what actually
          <span className="block text-primary">
            builds careers
          </span>
        </h1>

        <p className="text-subtle max-w-2xl mx-auto mt-6 relative">
          Free courses to get started. Premium content to go deep.
          A curated learning platform for developers and builders.
        </p>

        <div className="flex justify-center gap-4 mt-10 relative">
          <Link href="/courses" className="px-7 py-3 bg-primary text-white rounded-xl">
            Start learning free
          </Link>

          <Link href="/pricing" className="px-7 py-3 border rounded-xl">
            View premium
          </Link>
        </div>
      </section>

      {/* VALUE PROPOSITION */}
      <section className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold mb-3">
          Free + Premium learning, done right
        </h2>
        <p className="text-subtle">
          Start free. Upgrade when you're ready to go deeper.
        </p>
      </section>

      {/* COURSES */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold mb-6">Featured courses</h2>

        <div className="grid md:grid-cols-4 gap-5">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-64 bg-surface rounded-xl animate-pulse" />
              ))
            : data?.items.map((c, i) => (
                <CourseCard key={c.courseId} course={c} index={i} />
              ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-24">
        <h2 className="text-3xl font-bold">
          Upgrade when you're ready
        </h2>

        <p className="text-subtle mt-3">
          Free courses are always available. Premium unlocks deeper content.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Link href="/courses" className="px-8 py-3 bg-primary text-white rounded-xl">
            Start free
          </Link>

          <Link href="/pricing" className="px-8 py-3 border rounded-xl">
            See plans
          </Link>
        </div>
      </section>
    </div>
  )
}
