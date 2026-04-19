'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../lib/publicApi'
import { useAuthStore } from '../../store/authStore'
import PublicHeader from '../../components/layout/PublicHeader'
import type { Course, PagedResult } from '../../types/course'

const LEVEL_MAP: Record<number, string> = { 0: 'Beginner', 1: 'Intermediate', 2: 'Advanced' }
const STATUS_MAP: Record<number, string> = { 0: 'Draft', 1: 'Published', 2: 'Archived' }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeCourse(raw: any): Course {
  return { ...raw, level: LEVEL_MAP[raw.level] ?? raw.level, status: STATUS_MAP[raw.status] ?? raw.status }
}

function usePublicCourses(params: { search?: string; level?: string; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ['public-courses', params],
    queryFn: async () => {
      const res = await publicApi.get<PagedResult<Course>>('/api/courses', { params: { ...params, page: 1 } })
      return { ...res.data, items: res.data.items.map(normalizeCourse) }
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function StarRating({ value = 4.5 }: { value?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i <= Math.round(value) ? 'text-warning' : 'text-border'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-warning font-semibold ml-1">{value.toFixed(1)}</span>
    </div>
  )
}

const LEVEL_COLOR: Record<string, string> = {
  Beginner:     'bg-success/15 text-success',
  Intermediate: 'bg-warning/15 text-warning',
  Advanced:     'bg-danger/15 text-danger',
}

const THUMBNAIL_GRADIENT: string[] = [
  'from-violet-500/30 via-primary/20 to-background',
  'from-blue-500/30 via-cyan-500/20 to-background',
  'from-emerald-500/30 via-success/20 to-background',
  'from-orange-500/30 via-warning/20 to-background',
  'from-pink-500/30 via-danger/20 to-background',
  'from-indigo-500/30 via-blue-500/20 to-background',
]

function CourseCard({ course, index }: { course: Course; index: number }) {
  const router = useRouter()
  const gradient = THUMBNAIL_GRADIENT[index % THUMBNAIL_GRADIENT.length]

  return (
    <article
      onClick={() => router.push(`/courses/${course.courseId}`)}
      className="bg-surface border border-border rounded-2xl overflow-hidden cursor-pointer hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-200 group flex flex-col"
    >
      {/* Thumbnail */}
      <div className={`h-44 bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
        <svg
          className="w-14 h-14 text-white/20 group-hover:scale-110 transition-transform duration-300"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-text text-sm leading-snug line-clamp-2 mb-1 group-hover:text-primary transition-colors">
          {course.title}
        </h3>

        {course.instructorName && (
          <p className="text-xs text-subtle mb-2 truncate">{course.instructorName}</p>
        )}

        <div className="flex items-center gap-2 mb-2">
          <StarRating />
          {course.enrollmentCount != null && course.enrollmentCount > 0 && (
            <span className="text-xs text-subtle">
              ({course.enrollmentCount.toLocaleString()})
            </span>
          )}
        </div>

        <p className="text-xs text-subtle line-clamp-2 mb-3 flex-1">
          {course.description}
        </p>

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LEVEL_COLOR[course.level] ?? 'bg-surface text-subtle'}`}>
            {course.level}
          </span>
          {course.isFree && (
            <span className="text-sm font-bold text-success">Free</span>
          )}
        </div>
      </div>
    </article>
  )
}

function CourseCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="h-44 skeleton" />
      <div className="p-4 space-y-3">
        <div className="w-3/4 h-4 skeleton rounded" />
        <div className="w-1/2 h-3 skeleton rounded" />
        <div className="w-full h-3 skeleton rounded" />
        <div className="flex justify-between pt-2">
          <div className="w-16 h-5 skeleton rounded-full" />
          <div className="w-12 h-5 skeleton rounded" />
        </div>
      </div>
    </div>
  )
}

// ── Level filter pill ─────────────────────────────────────────────────────────

const LEVEL_FILTERS = [
  { label: 'All Levels', value: undefined },
  { label: 'Beginner',   value: 'Beginner'     },
  { label: 'Intermediate', value: 'Intermediate' },
  { label: 'Advanced',   value: 'Advanced'     },
]

// ── Stats ─────────────────────────────────────────────────────────────────────

const STATS = [
  { icon: '🎓', value: '10,000+', label: 'Students enrolled' },
  { icon: '📚', value: '500+',    label: 'Expert-led courses' },
  { icon: '🏆', value: '98%',     label: 'Satisfaction rate'  },
  { icon: '🌍', value: '50+',     label: 'Countries reached'  },
]

// ── How it works ──────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Find your course',
    desc: 'Browse hundreds of courses across all skill levels. Use search and filters to find exactly what you need.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    step: '02',
    title: 'Enroll and start',
    desc: 'Enroll with one click — free or paid. Start learning instantly with lifetime access to all course content.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    step: '03',
    title: 'Earn your certificate',
    desc: 'Complete all lessons to unlock your certificate of completion. Share it with your network and employers.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
]

// ── Features ──────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: '🎯', title: 'Expert instructors', desc: 'Learn from industry professionals with real-world experience.' },
  { icon: '⏱️', title: 'Learn at your pace', desc: 'No deadlines. Access course content any time, on any device.' },
  { icon: '💬', title: 'Community forum',    desc: 'Ask questions and connect with fellow learners and instructors.' },
  { icon: '📜', title: 'Certificates',       desc: 'Earn verifiable certificates upon completing your courses.' },
  { icon: '♾️', title: 'Lifetime access',   desc: 'One purchase, forever. Revisit lessons whenever you want.' },
  { icon: '💰', title: 'Coupons & promos',   desc: 'Get the best deals with coupon codes and promotional pricing.' },
]

// ── Testimonials ──────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    name: 'Sarah Mitchell',
    role: 'Software Engineer',
    text: 'YamiFlow helped me transition into tech in just 6 months. The courses are incredibly well-structured and the instructors are top-notch.',
    avatar: 'SM',
    rating: 5,
  },
  {
    name: 'Carlos Odinaka',
    role: 'UX Designer',
    text: 'The community forum is what sets YamiFlow apart. Got answers to my questions within hours — amazing experience.',
    avatar: 'CO',
    rating: 5,
  },
  {
    name: 'Emma Liang',
    role: 'Data Analyst',
    text: "I've tried many platforms but YamiFlow's certificate program is the most respected by employers. Worth every penny.",
    avatar: 'EL',
    rating: 5,
  },
]

// ── Footer account links ──────────────────────────────────────────────────────

function FooterAccountLinks({ isLoggedIn }: { isLoggedIn: boolean }) {
  const authedLinks = [
    { label: 'Dashboard',       to: '/dashboard'              },
    { label: 'Profile',         to: '/account/profile'        },
    { label: 'Change Password', to: '/account/change-password'},
    { label: 'Notifications',   to: '/notifications'          },
  ]
  const guestLinks = [
    { label: 'Sign In', to: '/login'    },
    { label: 'Sign Up', to: '/register' },
  ]
  const links = isLoggedIn ? authedLinks : guestLinks
  return (
    <div>
      <h4 className="text-sm font-semibold text-text mb-4">Account</h4>
      <ul className="space-y-2">
        {links.map(({ label, to }) => (
          <li key={label}>
            <Link href={to} className="text-xs text-subtle hover:text-text transition-colors">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LandingPage() {
  const user = useAuthStore((s) => s.user)

  const [activeLevel, setActiveLevel] = useState<string | undefined>(undefined)

  const { data: coursesData, isLoading } = usePublicCourses({
    level: activeLevel,
    pageSize: 8,
  })

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -top-20 right-0 w-80 h-80 rounded-full bg-violet-500/8 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            The smarter way to learn online
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-text leading-tight tracking-tight mb-6">
            Learn without
            <span className="block bg-gradient-to-r from-primary via-violet-400 to-primary bg-clip-text text-transparent">
              limits
            </span>
          </h1>

          <p className="text-lg text-subtle max-w-2xl mx-auto mb-10">
            Unlock new skills with expert-led courses in development, design, business, and more.
            Start learning today — at your own pace, from anywhere.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/courses"
              className="px-8 py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors"
            >
              Explore Courses
            </Link>
            {!user && (
              <Link
                href="/register"
                className="px-8 py-3.5 bg-surface hover:bg-surface-hover text-text font-semibold rounded-xl border border-border transition-colors"
              >
                Sign up free
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────── */}
      <section className="border-y border-border bg-surface/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map(({ icon, value, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl mb-1">{icon}</div>
                <div className="text-2xl font-bold text-text">{value}</div>
                <div className="text-xs text-subtle mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Courses ─────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-text">Featured Courses</h2>
            <p className="text-subtle mt-1">Handpicked courses loved by our community</p>
          </div>
          <Link
            href="/courses"
            className="text-sm font-medium text-primary hover:text-primary-hover transition-colors flex items-center gap-1 shrink-0"
          >
            View all courses
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Level filter pills */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
          {LEVEL_FILTERS.map(({ label, value }) => (
            <button
              key={label}
              onClick={() => setActiveLevel(value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                activeLevel === value
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                  : 'bg-surface text-subtle border-border hover:text-text hover:border-subtle'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {isLoading
            ? [...Array(8)].map((_, i) => <CourseCardSkeleton key={i} />)
            : coursesData?.items.length === 0
            ? (
              <div className="col-span-full py-16 text-center">
                <p className="text-subtle">No courses found for this level yet.</p>
              </div>
            )
            : coursesData?.items.map((course, i) => (
              <CourseCard key={course.courseId} course={course} index={i} />
            ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="border-y border-border bg-surface/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text">How it works</h2>
            <p className="text-subtle mt-2">Get started in three simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ step, title, desc, icon }) => (
              <div key={step} className="relative text-center">
                {/* Step number */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{step}</span>
                </div>
                <div className="pt-6 px-6 pb-8 bg-surface border border-border rounded-2xl hover:border-primary/30 transition-colors h-full">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
                    {icon}
                  </div>
                  <h3 className="font-semibold text-text mb-2">{title}</h3>
                  <p className="text-sm text-subtle leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-text">Why choose YamiFlow?</h2>
          <p className="text-subtle mt-2">Everything you need for a world-class learning experience</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="flex gap-4 p-5 bg-surface border border-border rounded-2xl hover:border-primary/30 transition-colors"
            >
              <span className="text-2xl shrink-0 mt-0.5">{icon}</span>
              <div>
                <h3 className="font-semibold text-text text-sm mb-1">{title}</h3>
                <p className="text-xs text-subtle leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────── */}
      <section className="border-y border-border bg-surface/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text">What our students say</h2>
            <p className="text-subtle mt-2">Join thousands of learners who transformed their careers</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, text, avatar, rating }) => (
              <div key={name} className="bg-surface border border-border rounded-2xl p-6">
                <StarRating value={rating} />
                <p className="text-sm text-subtle leading-relaxed mt-4 mb-6 italic">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                    {avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text">{name}</p>
                    <p className="text-xs text-subtle">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/20 p-10 sm:p-16 text-center">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">
              Ready to start learning?
            </h2>
            <p className="text-subtle mb-8 max-w-lg mx-auto">
              Join over 10,000 students already learning on YamiFlow. Create your free account today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {user ? (
                <>
                  <Link
                    href="/courses"
                    className="px-8 py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors"
                  >
                    Browse Courses
                  </Link>
                  <Link
                    href="/dashboard"
                    className="px-8 py-3.5 bg-surface hover:bg-surface-hover text-text font-semibold rounded-xl border border-border transition-colors"
                  >
                    My Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="px-8 py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors"
                  >
                    Join for free
                  </Link>
                  <Link
                    href="/courses"
                    className="px-8 py-3.5 bg-surface hover:bg-surface-hover text-text font-semibold rounded-xl border border-border transition-colors"
                  >
                    Browse Courses
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-border bg-surface/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-text">YamiFlow</span>
              </Link>
              <p className="text-xs text-subtle leading-relaxed">
                Expert-led online learning for everyone. Unlock your potential today.
              </p>
            </div>

            {/* Learn */}
            <div>
              <h4 className="text-sm font-semibold text-text mb-4">Learn</h4>
              <ul className="space-y-2">
                {[
                  { label: 'Browse Courses',    to: '/courses'    },
                  { label: 'My Learning',       to: '/enrollments/my' },
                  { label: 'Forum',             to: '/forum'      },
                  { label: 'Certificates',      to: '/courses'    },
                ].map(({ label, to }) => (
                  <li key={label}>
                    <Link href={to} className="text-xs text-subtle hover:text-text transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Teach */}
            <div>
              <h4 className="text-sm font-semibold text-text mb-4">Teach</h4>
              <ul className="space-y-2">
                {[
                  { label: 'Become an Instructor', to: '/instructor' },
                  { label: 'Instructor Dashboard', to: '/instructor' },
                  { label: 'Manage Coupons',       to: '/coupons'    },
                ].map(({ label, to }) => (
                  <li key={label}>
                    <Link href={to} className="text-xs text-subtle hover:text-text transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <FooterAccountLinks isLoggedIn={!!user} />
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-subtle">
              © {new Date().getFullYear()} YamiFlow. All rights reserved.
            </p>
            <p className="text-xs text-subtle">
              Built with passion for learners everywhere.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
