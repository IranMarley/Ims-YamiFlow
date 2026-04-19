'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '../../store/authStore'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import Header from '../../components/layout/Header'
import Spinner from '../../components/ui/Spinner'
import { api } from '../../lib/axios'

// ── Types ─────────────────────────────────────────────
interface LessonDetail {
  lessonId: string
  title: string
  order: number
  type: number
  durationSeconds: number
  contentUrl: string | null
  isFreePreview: boolean
}

interface ModuleDetail {
  moduleId: string
  title: string
  order: number
  lessons: LessonDetail[]
}

interface CourseDetail {
  courseId: string
  title: string
  slug: string
  description: string
  thumbnail: string | null
  price: number
  level: number
  status: number
  instructorId: string
  publishedAt: string | null
  enrollmentCount: number
  modules: ModuleDetail[]
}

// ── Service calls ─────────────────────────────────────
const fetchCourse = (id: string) =>
  api.get<CourseDetail>(`/api/courses/${id}`).then((r) => r.data)

const setPromotion = (id: string, promotionalPrice: number | null, expiresAt: string | null) =>
  api.put(`/api/courses/${id}/promotion`, { promotionalPrice, expiresAt })

const updateCourse = (id: string, data: { title: string; description: string; price: number; level: number }) =>
  api.put(`/api/courses/${id}`, data).then((r) => r.data)

const publishCourse = (id: string) => api.post(`/api/courses/${id}/publish`)
const archiveCourse = (id: string) => api.post(`/api/courses/${id}/archive`)

const createCourse = (data: { title: string; description: string; price: number; level: number }) =>
  api.post<{ courseId: string }>('/api/courses', data).then((r) => r.data)

const addModule    = (courseId: string, title: string, order: number) =>
  api.post(`/api/courses/${courseId}/modules`, { title, order })
const deleteModule = (courseId: string, moduleId: string) =>
  api.delete(`/api/courses/${courseId}/modules/${moduleId}`)

const addLesson    = (courseId: string, moduleId: string, data: { title: string; type: number; durationSeconds: number; order: number }) =>
  api.post(`/api/courses/${courseId}/modules/${moduleId}/lessons`, data)
const deleteLesson = (courseId: string, moduleId: string, lessonId: string) =>
  api.delete(`/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`)

// ── Level helpers ─────────────────────────────────────
const LEVELS = ['Beginner', 'Intermediate', 'Advanced']
const STATUS_LABELS = ['Draft', 'Published', 'Archived']
const STATUS_COLORS = ['bg-warning/15 text-warning', 'bg-success/15 text-success', 'bg-subtle/15 text-subtle']

// ── New Course Page ───────────────────────────────────
export function NewCoursePage() {
  const router      = useRouter()
  const { user }    = useAuthStore()
  const queryClient = useQueryClient()

  if (user?.role !== 'Instructor' && user?.role !== 'Admin') return null

  const [title, setTitle]       = useState('')
  const [desc, setDesc]         = useState('')
  const [price, setPrice]       = useState('0')
  const [level, setLevel]       = useState(0)

  const mutation = useMutation({
    mutationFn: () =>
      createCourse({ title, description: desc, price: parseFloat(price) || 0, level }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['instructor'] })
      router.push(`/instructor/courses/${data.courseId}`)
    },
  })

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.push('/instructor')} className="text-subtle hover:text-text transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-text">New Course</h1>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Title</label>
            <input
              suppressHydrationWarning
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Complete React Course"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Description</label>
            <textarea suppressHydrationWarning
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={4}
              placeholder="What will students learn?"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Price ($)</label>
              <input
                suppressHydrationWarning
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {LEVELS.map((l, i) => <option key={l} value={i}>{l}</option>)}
              </select>
            </div>
          </div>

          {mutation.isError && (
            <p className="text-sm text-danger">Failed to create course.</p>
          )}

          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !title.trim()}
            className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {mutation.isPending ? 'Creating…' : 'Create Course'}
          </button>
        </div>
      </main>
    </div>
  )
}

// ── Course Management Page ────────────────────────────
export default function InstructorCoursePage() {
  const params       = useParams()
  const courseId     = (params?.id as string) ?? ''
  const router       = useRouter()
  const { user }     = useAuthStore()
  const queryClient  = useQueryClient()
  const [tab, setTab] = useState<'details' | 'modules'>('details')

  if (user?.role !== 'Instructor' && user?.role !== 'Admin') return null

  // details edit state
  const [title, setTitle]   = useState('')
  const [desc, setDesc]     = useState('')
  const [price, setPrice]   = useState('0')
  const [level, setLevel]   = useState(0)
  const [dirty, setDirty]   = useState(false)

  // promotion state
  const [promoPrice, setPromoPrice] = useState('')
  const [promoExpiry, setPromoExpiry] = useState('')

  // module add state
  const [newModuleTitle, setNewModuleTitle] = useState('')
  // lesson add state per module
  const [newLessonTitle, setNewLessonTitle] = useState<Record<string, string>>({})

  const { data: course, isLoading } = useQuery({
    queryKey: ['course-detail', courseId],
    queryFn: () => fetchCourse(courseId!),
    enabled: !!courseId,
    staleTime: 0,
  })

  // Populate form fields only on first load (when not dirty)
  useEffect(() => {
    if (course && !dirty) {
      setTitle(course.title)
      setDesc(course.description)
      setPrice(String(course.price))
      setLevel(course.level)
    }
  }, [course?.courseId]) // only run when courseId changes (first load)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['course-detail', courseId] })

  const updateMutation = useMutation({
    mutationFn: () => updateCourse(courseId!, { title, description: desc, price: parseFloat(price) || 0, level }),
    onSuccess: () => { setDirty(false); invalidate(); toast.success('Course details saved.') },
  })

  const publishMutation = useMutation({
    mutationFn: () => publishCourse(courseId!),
    onSuccess: () => { invalidate(); toast.success('Course published.') },
  })

  const archiveMutation = useMutation({
    mutationFn: () => archiveCourse(courseId!),
    onSuccess: () => { invalidate(); toast.success('Course archived.') },
  })

  const addModuleMutation = useMutation({
    mutationFn: (moduleTitle: string) =>
      addModule(courseId!, moduleTitle, (course?.modules.length ?? 0) + 1),
    onSuccess: () => { setNewModuleTitle(''); invalidate() },
  })

  const deleteModuleMutation = useMutation({
    mutationFn: (moduleId: string) => deleteModule(courseId!, moduleId),
    onSuccess: invalidate,
  })

  const addLessonMutation = useMutation({
    mutationFn: ({ moduleId, lessonTitle, order }: { moduleId: string; lessonTitle: string; order: number }) =>
      addLesson(courseId!, moduleId, { title: lessonTitle, type: 0, durationSeconds: 0, order }),
    onSuccess: (_data, vars) => {
      setNewLessonTitle((prev) => ({ ...prev, [vars.moduleId]: '' }))
      invalidate()
    },
  })

  const deleteLessonMutation = useMutation({
    mutationFn: ({ moduleId, lessonId }: { moduleId: string; lessonId: string }) =>
      deleteLesson(courseId!, moduleId, lessonId),
    onSuccess: invalidate,
  })

  const setPromotionMutation = useMutation({
    mutationFn: () => setPromotion(
      courseId!,
      promoPrice ? parseFloat(promoPrice) : null,
      promoExpiry ? new Date(promoExpiry).toISOString() : null
    ),
    onSuccess: () => { invalidate(); toast.success('Promotion updated.') },
  })

  if (isLoading || !course) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center items-center h-96"><Spinner size="lg" /></div>
      </div>
    )
  }

  const statusLabel = STATUS_LABELS[course.status] ?? 'Draft'
  const statusColor = STATUS_COLORS[course.status] ?? STATUS_COLORS[0]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Breadcrumb + title */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push('/instructor')} className="text-subtle hover:text-text transition-colors shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-text truncate">{course.title}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                  {statusLabel}
                </span>
                <span className="text-xs text-subtle">{course.enrollmentCount} enrolled</span>
              </div>
            </div>
          </div>

          {/* Status actions */}
          <div className="flex gap-2 shrink-0">
            {course.status === 0 && (
              <button
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
                className="px-4 py-2 rounded-xl bg-success text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {publishMutation.isPending ? 'Publishing…' : 'Publish'}
              </button>
            )}
            {course.status === 1 && (
              <button
                onClick={() => archiveMutation.mutate()}
                disabled={archiveMutation.isPending}
                className="px-4 py-2 rounded-xl bg-subtle/20 text-text text-sm font-medium hover:bg-subtle/30 disabled:opacity-50 transition-all"
              >
                {archiveMutation.isPending ? 'Archiving…' : 'Archive'}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-6 border-b border-border">
          {(['details', 'modules'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px capitalize ${
                tab === t ? 'border-primary text-primary' : 'border-transparent text-subtle hover:text-text'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Details tab */}
        {tab === 'details' && (
          <div className="space-y-5">
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Title</label>
              <input
                suppressHydrationWarning
                value={title}
                onChange={(e) => { setTitle(e.target.value); setDirty(true) }}
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Description</label>
              <textarea suppressHydrationWarning
                value={desc}
                onChange={(e) => { setDesc(e.target.value); setDirty(true) }}
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Price ($)</label>
                <input
                  suppressHydrationWarning
                  type="number" min="0" step="0.01"
                  value={price}
                  onChange={(e) => { setPrice(e.target.value); setDirty(true) }}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Level</label>
                <select
                  value={level}
                  onChange={(e) => { setLevel(Number(e.target.value)); setDirty(true) }}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {LEVELS.map((l, i) => <option key={l} value={i}>{l}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending || !dirty}
              className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              {updateMutation.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>

          {/* Promotion section */}
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-text mb-1">Promotional Price</h3>
              <p className="text-xs text-subtle">Set a limited-time discount for this course.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Promo price ($)</label>
                <input
                  suppressHydrationWarning
                  type="number"
                  min="0"
                  step="0.01"
                  value={promoPrice}
                  onChange={(e) => setPromoPrice(e.target.value)}
                  placeholder="e.g. 9.99"
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Expires at</label>
                <input
                  suppressHydrationWarning
                  type="date"
                  value={promoExpiry}
                  onChange={(e) => setPromoExpiry(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPromotionMutation.mutate()}
                disabled={setPromotionMutation.isPending}
                className="px-5 py-2 rounded-xl bg-warning/20 text-warning text-sm font-medium hover:bg-warning/30 disabled:opacity-50 transition-colors"
              >
                {setPromotionMutation.isPending ? 'Saving…' : 'Set promotion'}
              </button>
              <button
                onClick={() => { setPromoPrice(''); setPromoExpiry(''); setPromotion(courseId!, null, null) }}
                className="px-5 py-2 rounded-xl bg-surface text-subtle text-sm font-medium hover:text-text hover:bg-surface-hover/50 transition-colors border border-border"
              >
                Clear
              </button>
            </div>
          </div>
          </div>
        )}

        {/* Modules tab */}
        {tab === 'modules' && (
          <div className="space-y-4">
            {course.modules.length === 0 && (
              <div className="py-12 text-center bg-surface border border-border rounded-2xl">
                <p className="text-subtle text-sm">No modules yet. Add one below.</p>
              </div>
            )}

            {course.modules.map((mod) => (
              <div key={mod.moduleId} className="bg-surface border border-border rounded-2xl overflow-hidden">
                {/* Module header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface-hover/30">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-subtle font-mono">{mod.order}.</span>
                    <span className="font-medium text-text text-sm">{mod.title}</span>
                    <span className="text-xs text-subtle">({mod.lessons.length} lessons)</span>
                  </div>
                  <button
                    onClick={() => deleteModuleMutation.mutate(mod.moduleId)}
                    disabled={deleteModuleMutation.isPending}
                    className="text-xs text-danger hover:text-danger/70 transition-colors"
                  >
                    Delete module
                  </button>
                </div>

                {/* Lessons */}
                <div className="divide-y divide-border/50">
                  {mod.lessons.map((lesson) => (
                    <div key={lesson.lessonId} className="flex items-center justify-between px-5 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-subtle">{lesson.order}.</span>
                        <span className="text-sm text-text truncate">{lesson.title}</span>
                        {lesson.isFreePreview && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-success/10 text-success">Free</span>
                        )}
                      </div>
                      <button
                        onClick={() => deleteLessonMutation.mutate({ moduleId: mod.moduleId, lessonId: lesson.lessonId })}
                        className="text-xs text-danger hover:text-danger/70 transition-colors shrink-0 ml-3"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add lesson row */}
                <div className="flex items-center gap-2 px-5 py-3 border-t border-border bg-background/40">
                  <input
                    suppressHydrationWarning
                    value={newLessonTitle[mod.moduleId] ?? ''}
                    onChange={(e) => setNewLessonTitle((prev) => ({ ...prev, [mod.moduleId]: e.target.value }))}
                    placeholder="New lesson title…"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (newLessonTitle[mod.moduleId] ?? '').trim()) {
                        addLessonMutation.mutate({
                          moduleId: mod.moduleId,
                          lessonTitle: newLessonTitle[mod.moduleId],
                          order: mod.lessons.length + 1,
                        })
                      }
                    }}
                  />
                  <button
                    onClick={() =>
                      addLessonMutation.mutate({
                        moduleId: mod.moduleId,
                        lessonTitle: newLessonTitle[mod.moduleId] ?? '',
                        order: mod.lessons.length + 1,
                      })
                    }
                    disabled={!( newLessonTitle[mod.moduleId] ?? '').trim() || addLessonMutation.isPending}
                    className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-40 transition-colors"
                  >
                    + Lesson
                  </button>
                </div>
              </div>
            ))}

            {/* Add module */}
            <div className="flex gap-3 pt-2">
              <input
                suppressHydrationWarning
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                placeholder="New module title…"
                className="flex-1 px-4 py-2.5 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newModuleTitle.trim())
                    addModuleMutation.mutate(newModuleTitle)
                }}
              />
              <button
                onClick={() => addModuleMutation.mutate(newModuleTitle)}
                disabled={!newModuleTitle.trim() || addModuleMutation.isPending}
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-40 transition-colors"
              >
                {addModuleMutation.isPending ? '…' : '+ Module'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
