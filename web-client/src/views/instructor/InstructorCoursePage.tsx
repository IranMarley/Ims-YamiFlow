'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '../../store/authStore'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type Active,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Header from '../../components/layout/Header'
import Spinner from '../../components/ui/Spinner'
import { api, BASE_URL } from '../../lib/axios'
import { videoService } from '../../services/video.service'

// ── Types ──────────────────────────────────────────────────────────────────────

interface LessonDetail {
  lessonId: string
  title: string
  order: number
  type: number
  durationSeconds: number
  contentUrl: string | null
  isFreePreview: boolean
  hasVideo: boolean
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
  isFree: boolean
  level: number
  status: number
  instructorId: string
  publishedAt: string | null
  enrollmentCount: number
  modules: ModuleDetail[]
}

interface VideoUploadState {
  uploading: boolean
  progress: number
  jobId: string | null
  jobStatus: string | null
}

// ── API helpers ────────────────────────────────────────────────────────────────

const fetchCourse = (id: string) =>
  api.get<CourseDetail>(`/api/courses/${id}`).then((r) => r.data)

const updateCourseApi = (id: string, data: { title: string; description: string; isFree: boolean; level: number }) =>
  api.put(`/api/courses/${id}`, data)

const publishCourse = (id: string) => api.post(`/api/courses/${id}/publish`)
const archiveCourse = (id: string) => api.post(`/api/courses/${id}/archive`)

const createCourseApi = (data: { title: string; description: string; isFree: boolean; level: number }) =>
  api.post<{ courseId: string }>('/api/courses', data).then((r) => r.data)

const addModuleApi = (courseId: string, title: string, order: number) =>
  api.post(`/api/courses/${courseId}/modules`, { title, order })

const deleteModuleApi = (courseId: string, moduleId: string) =>
  api.delete(`/api/courses/${courseId}/modules/${moduleId}`)

const reorderModulesApi = (courseId: string, items: { moduleId: string; order: number }[]) =>
  api.put(`/api/courses/${courseId}/modules/reorder`, { items })

const addLessonApi = (
  courseId: string,
  moduleId: string,
  data: { title: string; order: number },
) => api.post(`/api/courses/${courseId}/modules/${moduleId}/lessons`, data)

const deleteLessonApi = (courseId: string, moduleId: string, lessonId: string) =>
  api.delete(`/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`)

const updateLessonApi = (
  courseId: string,
  moduleId: string,
  lessonId: string,
  data: { title: string; contentUrl: string | null; isFreePreview: boolean },
) => api.put(`/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, data)

const uploadThumbnailApi = async (courseId: string, file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.post<{ thumbnailUrl: string }>(`/api/courses/${courseId}/thumbnail`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)
}

const reorderLessonsApi = (
  courseId: string,
  moduleId: string,
  items: { lessonId: string; order: number }[],
) => api.put(`/api/courses/${courseId}/modules/${moduleId}/lessons/reorder`, { items })

const moveLessonApi = (
  courseId: string,
  sourceModuleId: string,
  lessonId: string,
  targetModuleId: string,
  newOrder: number,
) =>
  api.put(`/api/courses/${courseId}/modules/${sourceModuleId}/lessons/${lessonId}/move`, {
    targetModuleId,
    newOrder,
  })

// ── Constants ──────────────────────────────────────────────────────────────────

const LEVELS = ['Beginner', 'Intermediate', 'Advanced']
const STATUS_LABELS = ['Draft', 'Published', 'Archived']
const STATUS_COLORS = [
  'bg-warning/15 text-warning',
  'bg-success/15 text-success',
  'bg-subtle/15 text-subtle',
]

const VIDEO_JOB_CONFIG: Record<string, { color: string; label: string }> = {
  Pending:    { color: 'bg-warning/15 text-warning',  label: 'Queued' },
  Processing: { color: 'bg-primary/15 text-primary',  label: 'Processing…' },
  Completed:  { color: 'bg-success/15 text-success',  label: 'Ready' },
  Dead:       { color: 'bg-danger/15 text-danger',    label: 'Failed' },
}

// ── Drag handle icon ───────────────────────────────────────────────────────────

function DragHandle({ listeners, attributes }: { listeners?: object; attributes?: object }) {
  return (
    <div
      {...listeners}
      {...attributes}
      className="shrink-0 flex items-center justify-center w-5 h-5 text-subtle/40 hover:text-subtle cursor-grab active:cursor-grabbing touch-none select-none"
      title="Drag to reorder"
    >
      <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
        <circle cx="3" cy="2"  r="1.2" />
        <circle cx="7" cy="2"  r="1.2" />
        <circle cx="3" cy="7"  r="1.2" />
        <circle cx="7" cy="7"  r="1.2" />
        <circle cx="3" cy="12" r="1.2" />
        <circle cx="7" cy="12" r="1.2" />
      </svg>
    </div>
  )
}

// ── VideoUploadPanel ───────────────────────────────────────────────────────────

function VideoUploadPanel({
  courseId,
  lesson,
  state,
  onUpload,
}: {
  courseId: string
  lesson: LessonDetail
  state: VideoUploadState | undefined
  onUpload: (lessonId: string, file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const hasVideo  = !!lesson.contentUrl
  const jobStatus = state?.jobStatus
  const isActive  = jobStatus === 'Pending' || jobStatus === 'Processing'

  const MAX_VIDEO_BYTES = 200 * 1024 * 1024 // 200 MB

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_VIDEO_BYTES) {
      toast.error(`File is too large. Maximum allowed size is 200 MB (your file: ${(file.size / 1024 / 1024).toFixed(1)} MB).`)
      e.target.value = ''
      return
    }
    onUpload(lesson.lessonId, file)
    e.target.value = ''
  }

  return (
    <div className="border border-border rounded-xl p-4 bg-background/50 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-subtle">Video</span>
        {jobStatus && VIDEO_JOB_CONFIG[jobStatus] ? (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${VIDEO_JOB_CONFIG[jobStatus].color}`}>
            {VIDEO_JOB_CONFIG[jobStatus].label}
          </span>
        ) : !jobStatus && hasVideo ? (
          <span className="text-xs px-2 py-0.5 rounded-full bg-success/15 text-success font-medium">Ready</span>
        ) : null}
      </div>

      {state?.uploading && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-subtle">
            <span>Uploading…</span>
            <span>{state.progress}%</span>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-150"
              style={{ width: `${state.progress}%` }}
            />
          </div>
        </div>
      )}

      {isActive && !state?.uploading && (
        <div className="flex items-center gap-2 text-xs text-subtle">
          <Spinner size="sm" />
          <span>Processing video — this takes a few minutes.</span>
        </div>
      )}

      {jobStatus === 'Dead' && (
        <p className="text-xs text-danger">Processing failed after 3 attempts. Upload a new file to retry.</p>
      )}

      {!state?.uploading && !isActive && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-subtle hover:text-text hover:bg-surface-hover transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {hasVideo ? 'Replace video' : 'Upload video'}
          </button>
          {hasVideo && !jobStatus && (
            <span className="text-xs text-subtle">Video is ready for students.</span>
          )}
        </div>
      )}

      <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleSelect} />
    </div>
  )
}

// ── LessonRow ──────────────────────────────────────────────────────────────────

function LessonRow({
  lesson,
  moduleId,
  courseId,
  expanded,
  videoState,
  dragHandleListeners,
  dragHandleAttributes,
  onToggle,
  onSave,
  onDelete,
  onUpload,
}: {
  lesson: LessonDetail
  moduleId: string
  courseId: string
  expanded: boolean
  videoState: VideoUploadState | undefined
  dragHandleListeners?: object
  dragHandleAttributes?: object
  onToggle: () => void
  onSave: (moduleId: string, lessonId: string, data: { title: string; contentUrl: string | null; isFreePreview: boolean }) => void
  onDelete: (moduleId: string, lessonId: string) => void
  onUpload: (lessonId: string, file: File) => void
}) {
  const [title, setTitle]             = useState(lesson.title)
  const [freePreview, setFreePreview] = useState(lesson.isFreePreview)
  const [dirty, setDirty]             = useState(false)

  useEffect(() => {
    if (!dirty) {
      setTitle(lesson.title)
      setFreePreview(lesson.isFreePreview)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.lessonId])

  const hasActiveJob = videoState?.jobStatus === 'Pending' || videoState?.jobStatus === 'Processing'
  const jobCfg       = videoState?.jobStatus ? VIDEO_JOB_CONFIG[videoState.jobStatus] : null

  return (
    <div className="border-b border-border/50 last:border-b-0">
      {/* Collapsed row */}
      <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-surface-hover/20 transition-colors">
        <DragHandle listeners={dragHandleListeners} attributes={dragHandleAttributes} />

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-xs text-subtle font-mono shrink-0">{lesson.order}.</span>
          <span className="text-sm text-text truncate">{lesson.title}</span>
          {lesson.isFreePreview && (
            <span className="shrink-0 text-xs px-1.5 py-0.5 rounded bg-success/10 text-success">Free</span>
          )}
          {videoState?.uploading ? (
            <span className="shrink-0 text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              Uploading {videoState.progress}%
            </span>
          ) : hasActiveJob && jobCfg ? (
            <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded ${jobCfg.color}`}>
              {jobCfg.label}
            </span>
          ) : lesson.contentUrl ? (
            <span className="shrink-0 text-xs px-1.5 py-0.5 rounded bg-success/10 text-success">Video</span>
          ) : null}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button onClick={onToggle} className="text-xs text-subtle hover:text-text transition-colors">
            {expanded ? 'Close' : 'Edit'}
          </button>
          <button
            onClick={() => onDelete(moduleId, lesson.lessonId)}
            className="text-xs text-danger hover:text-danger/70 transition-colors"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Expanded edit panel */}
      {expanded && (
        <div className="px-5 pb-4 pt-2 space-y-3 bg-background/30 border-t border-border/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-subtle mb-1">Title</label>
              <input
                suppressHydrationWarning
                value={title}
                onChange={(e) => { setTitle(e.target.value); setDirty(true) }}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={freePreview}
                  onChange={(e) => { setFreePreview(e.target.checked); setDirty(true) }}
                />
                <div className="w-9 h-5 bg-border peer-focus:ring-2 peer-focus:ring-primary/40 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                <span className="ml-2 text-sm text-text">Free preview</span>
              </label>
            </div>
          </div>

          <button
            disabled={!dirty}
            onClick={() => {
              onSave(moduleId, lesson.lessonId, {
                title,
                contentUrl: lesson.contentUrl,
                isFreePreview: freePreview,
              })
              setDirty(false)
            }}
            className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-hover disabled:opacity-40 transition-colors"
          >
            Save lesson
          </button>

          <VideoUploadPanel courseId={courseId} lesson={lesson} state={videoState} onUpload={onUpload} />
        </div>
      )}
    </div>
  )
}

// ── SortableLessonRow ──────────────────────────────────────────────────────────

function SortableLessonRow(props: {
  lesson: LessonDetail
  moduleId: string
  courseId: string
  expanded: boolean
  videoState: VideoUploadState | undefined
  onToggle: () => void
  onSave: (moduleId: string, lessonId: string, data: { title: string; contentUrl: string | null; isFreePreview: boolean }) => void
  onDelete: (moduleId: string, lessonId: string) => void
  onUpload: (lessonId: string, file: File) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.lesson.lessonId,
    data: { type: 'lesson', lessonId: props.lesson.lessonId, moduleId: props.moduleId },
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
      }}
    >
      <LessonRow
        {...props}
        dragHandleListeners={listeners}
        dragHandleAttributes={attributes}
      />
    </div>
  )
}

// ── LessonDragOverlay ──────────────────────────────────────────────────────────

function LessonDragOverlay({ lesson }: { lesson: LessonDetail }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 bg-surface border border-primary/30 rounded-xl shadow-xl">
      <DragHandle />
      <span className="text-xs text-subtle font-mono shrink-0">{lesson.order}.</span>
      <span className="text-sm text-text truncate">{lesson.title}</span>
    </div>
  )
}

// ── ModuleDragOverlay ──────────────────────────────────────────────────────────

function ModuleDragOverlay({ mod }: { mod: ModuleDetail }) {
  return (
    <div className="bg-surface border border-primary/30 rounded-2xl shadow-xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3.5 bg-surface-hover/30">
        <DragHandle />
        <span className="text-xs text-subtle font-mono">{mod.order}.</span>
        <span className="font-medium text-text text-sm">{mod.title}</span>
        <span className="text-xs text-subtle">({mod.lessons.length} lessons)</span>
      </div>
    </div>
  )
}

// ── SortableModuleCard ─────────────────────────────────────────────────────────

function SortableModuleCard({
  mod,
  courseId,
  expandedLesson,
  videoStates,
  newLessonTitle,
  addLessonPending,
  deleteLessonPending,
  onDeleteModule,
  onAddLesson,
  onNewLessonTitleChange,
  onToggleLesson,
  onSaveLesson,
  onDeleteLesson,
  onUpload,
}: {
  mod: ModuleDetail
  courseId: string
  expandedLesson: string | null
  videoStates: Record<string, VideoUploadState>
  newLessonTitle: Record<string, string>
  addLessonPending: boolean
  deleteLessonPending: boolean
  onDeleteModule: (moduleId: string) => void
  onAddLesson: (moduleId: string, title: string, order: number) => void
  onNewLessonTitleChange: (moduleId: string, value: string) => void
  onToggleLesson: (lessonId: string) => void
  onSaveLesson: (moduleId: string, lessonId: string, data: { title: string; contentUrl: string | null; isFreePreview: boolean }) => void
  onDeleteLesson: (moduleId: string, lessonId: string) => void
  onUpload: (lessonId: string, file: File) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: mod.moduleId,
    data: { type: 'module', moduleId: mod.moduleId },
  })

  const lessonInput = newLessonTitle[mod.moduleId] ?? ''

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
      }}
      className="bg-surface border border-border rounded-2xl overflow-hidden"
    >
      {/* Module header */}
      <div className="flex items-center gap-2 px-3 py-3.5 border-b border-border bg-surface-hover/30">
        <DragHandle listeners={listeners} attributes={attributes} />
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs text-subtle font-mono shrink-0">{mod.order}.</span>
          <span className="font-medium text-text text-sm truncate">{mod.title}</span>
          <span className="text-xs text-subtle shrink-0">({mod.lessons.length} lessons)</span>
        </div>
        <button
          onClick={() => onDeleteModule(mod.moduleId)}
          disabled={deleteLessonPending}
          className="text-xs text-danger hover:text-danger/70 transition-colors shrink-0"
        >
          Delete module
        </button>
      </div>

      {/* Lessons */}
      <SortableContext
        id={mod.moduleId}
        items={mod.lessons.map((l) => l.lessonId)}
        strategy={verticalListSortingStrategy}
      >
        <div>
          {mod.lessons.length === 0 && (
            <div className="px-5 py-4 text-center text-xs text-subtle/60 italic">
              No lessons yet — drag one here or add below.
            </div>
          )}
          {mod.lessons.map((lesson) => (
            <SortableLessonRow
              key={lesson.lessonId}
              lesson={lesson}
              moduleId={mod.moduleId}
              courseId={courseId}
              expanded={expandedLesson === lesson.lessonId}
              videoState={videoStates[lesson.lessonId]}
              onToggle={() => onToggleLesson(lesson.lessonId)}
              onSave={onSaveLesson}
              onDelete={onDeleteLesson}
              onUpload={onUpload}
            />
          ))}
        </div>
      </SortableContext>

      {/* Add lesson */}
      <div className="flex items-center gap-2 px-5 py-3 border-t border-border bg-background/40">
        <input
          suppressHydrationWarning
          value={lessonInput}
          onChange={(e) => onNewLessonTitleChange(mod.moduleId, e.target.value)}
          placeholder="New lesson title…"
          className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && lessonInput.trim()) {
              onAddLesson(mod.moduleId, lessonInput, mod.lessons.length + 1)
            }
          }}
        />
        <button
          onClick={() => onAddLesson(mod.moduleId, lessonInput, mod.lessons.length + 1)}
          disabled={!lessonInput.trim() || addLessonPending}
          className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-40 transition-colors"
        >
          + Lesson
        </button>
      </div>
    </div>
  )
}

// ── NewCoursePage ──────────────────────────────────────────────────────────────

export function NewCoursePage() {
  const router      = useRouter()
  const { user }    = useAuthStore()
  const queryClient = useQueryClient()

  const [title, setTitle]   = useState('')
  const [desc, setDesc]     = useState('')
  const [isFree, setIsFree] = useState(false)
  const [level, setLevel]   = useState(0)

  if (user?.role !== 'Instructor' && user?.role !== 'Admin') return null

  const mutation = useMutation({
    mutationFn: () => createCourseApi({ title, description: desc, isFree, level }),
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
            <textarea
              suppressHydrationWarning
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={4}
              placeholder="What will students learn?"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} />
                  <div className="w-9 h-5 bg-border rounded-full transition-all peer-checked:bg-success after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                </div>
                <span className="text-sm text-text">Free course</span>
              </label>
            </div>
          </div>
          {mutation.isError && <p className="text-sm text-danger">Failed to create course.</p>}
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

// ── InstructorCoursePage ───────────────────────────────────────────────────────

export default function InstructorCoursePage() {
  const params      = useParams()
  const courseId    = (params?.id as string) ?? ''
  const router      = useRouter()
  const { user }    = useAuthStore()
  const queryClient = useQueryClient()

  // Course details state
  const [tab, setTab]                       = useState<'details' | 'modules'>('details')
  const [dirty, setDirty]                   = useState(false)
  const [title, setTitle]                   = useState('')
  const [desc, setDesc]                     = useState('')
  const [isFree, setIsFree]                 = useState(false)
  const [level, setLevel]                   = useState(0)
  const [thumbnailUrl, setThumbnailUrl]     = useState<string | null>(null)
  const [thumbnailUploading, setThumbnailUploading] = useState(false)
  const thumbnailInputRef                   = useRef<HTMLInputElement>(null)

  // Module/lesson UI state
  const [newModuleTitle, setNewModuleTitle]   = useState('')
  const [newLessonTitle, setNewLessonTitle]   = useState<Record<string, string>>({})
  const [expandedLesson, setExpandedLesson]   = useState<string | null>(null)
  const [videoStates, setVideoStates]         = useState<Record<string, VideoUploadState>>({})

  // Drag-and-drop state
  const [localModules, setLocalModules]       = useState<ModuleDetail[]>([])
  const [activeDragItem, setActiveDragItem]   = useState<Active | null>(null)
  const dragStartModuleId                     = useRef<string | null>(null)

  if (user?.role !== 'Instructor' && user?.role !== 'Admin') return null

  const { data: course, isLoading } = useQuery({
    queryKey: ['course-detail', courseId],
    queryFn: () => fetchCourse(courseId),
    enabled: !!courseId,
    staleTime: 0,
  })

  // Sync localModules from server (not while dragging)
  useEffect(() => {
    if (course && !activeDragItem) {
      setLocalModules(course.modules)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course])

  // Restore video job states for all video lessons on first course load
  useEffect(() => {
    if (!course) return
    const videoLessons = course.modules
      .flatMap((m) => m.lessons)
      .filter((l) => l.type === 0)

    videoLessons.forEach(async (lesson) => {
      // Skip if we already have state for this lesson
      if (videoStates[lesson.lessonId]) return
      const job = await videoService.getJobByLesson(lesson.lessonId)
      if (!job) return
      // Only restore active or failed jobs; completed ones show via lesson.contentUrl
      if (job.status === 'Completed') return
      setVideoStates((prev) => ({
        ...prev,
        [lesson.lessonId]: {
          uploading: false,
          progress: 0,
          jobId: job.jobId,
          jobStatus: job.status,
        },
      }))
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course?.courseId])

  // Sync course details form
  useEffect(() => {
    if (course && !dirty) {
      setTitle(course.title)
      setDesc(course.description)
      setIsFree(course.isFree)
      setLevel(course.level)
      setThumbnailUrl(course.thumbnail)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course?.courseId])

  // Poll active video jobs
  useEffect(() => {
    const activeEntries = Object.entries(videoStates).filter(
      ([, v]) => v.jobId && (v.jobStatus === 'Pending' || v.jobStatus === 'Processing'),
    )
    if (activeEntries.length === 0) return

    const interval = setInterval(async () => {
      for (const [lessonId, v] of activeEntries) {
        if (!v.jobId) continue
        try {
          const status = await videoService.getJobStatus(v.jobId)
          setVideoStates((prev) => ({
            ...prev,
            [lessonId]: { ...prev[lessonId], jobStatus: status.status },
          }))
          if (status.status === 'Completed') {
            queryClient.invalidateQueries({ queryKey: ['course-detail', courseId] })
            toast.success('Video processing complete.')
          }
          if (status.status === 'Dead') {
            toast.error('Video processing failed.')
          }
        } catch {
          // silent — will retry next tick
        }
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [videoStates, courseId, queryClient])

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['course-detail', courseId] })

  // ── Mutations ──────────────────────────────────────────────────────────────

  const updateMutation = useMutation({
    mutationFn: () => updateCourseApi(courseId, { title, description: desc, isFree, level }),
    onSuccess: () => { setDirty(false); invalidate(); toast.success('Course details saved.') },
  })

  const publishMutation = useMutation({
    mutationFn: () => publishCourse(courseId),
    onSuccess: () => { invalidate(); toast.success('Course published.') },
    onError: () => toast.error('Cannot publish — ensure all modules have at least one lesson.'),
  })

  const archiveMutation = useMutation({
    mutationFn: () => archiveCourse(courseId),
    onSuccess: () => { invalidate(); toast.success('Course archived.') },
  })

  const addModuleMutation = useMutation({
    mutationFn: (moduleTitle: string) =>
      addModuleApi(courseId, moduleTitle, localModules.length + 1),
    onSuccess: () => { setNewModuleTitle(''); invalidate() },
  })

  const deleteModuleMutation = useMutation({
    mutationFn: (moduleId: string) => deleteModuleApi(courseId, moduleId),
    onSuccess: invalidate,
  })

  const reorderModulesMutation = useMutation({
    mutationFn: (items: { moduleId: string; order: number }[]) =>
      reorderModulesApi(courseId, items),
    onError: () => { invalidate(); toast.error('Failed to save module order.') },
  })

  const addLessonMutation = useMutation({
    mutationFn: ({ moduleId, lessonTitle, order }: { moduleId: string; lessonTitle: string; order: number }) =>
      addLessonApi(courseId, moduleId, { title: lessonTitle, order }),
    onSuccess: (_data, vars) => {
      setNewLessonTitle((prev) => ({ ...prev, [vars.moduleId]: '' }))
      invalidate()
    },
  })

  const deleteLessonMutation = useMutation({
    mutationFn: ({ moduleId, lessonId }: { moduleId: string; lessonId: string }) =>
      deleteLessonApi(courseId, moduleId, lessonId),
    onSuccess: () => { setExpandedLesson(null); invalidate() },
  })

  const updateLessonMutation = useMutation({
    mutationFn: ({
      moduleId, lessonId, data,
    }: {
      moduleId: string
      lessonId: string
      data: { title: string; contentUrl: string | null; isFreePreview: boolean }
    }) => updateLessonApi(courseId, moduleId, lessonId, data),
    onSuccess: () => { invalidate(); toast.success('Lesson saved.') },
  })

  const reorderLessonsMutation = useMutation({
    mutationFn: ({ moduleId, items }: { moduleId: string; items: { lessonId: string; order: number }[] }) =>
      reorderLessonsApi(courseId, moduleId, items),
    onError: () => { invalidate(); toast.error('Failed to save lesson order.') },
  })

  const moveLessonMutation = useMutation({
    mutationFn: ({
      sourceModuleId, lessonId, targetModuleId, newOrder,
    }: {
      sourceModuleId: string
      lessonId: string
      targetModuleId: string
      newOrder: number
    }) => moveLessonApi(courseId, sourceModuleId, lessonId, targetModuleId, newOrder),
    onError: () => { invalidate(); toast.error('Failed to move lesson.') },
  })

  // ── Thumbnail upload ───────────────────────────────────────────────────────

  const handleThumbnailUpload = async (file: File) => {
    setThumbnailUploading(true)
    try {
      const result = await uploadThumbnailApi(courseId, file)
      setThumbnailUrl(result.thumbnailUrl)
      invalidate()
      toast.success('Thumbnail updated.')
    } catch {
      toast.error('Failed to upload thumbnail.')
    } finally {
      setThumbnailUploading(false)
    }
  }

  // ── Video upload ───────────────────────────────────────────────────────────

  const handleVideoUpload = async (lessonId: string, file: File) => {
    setVideoStates((prev) => ({
      ...prev,
      [lessonId]: { uploading: true, progress: 0, jobId: null, jobStatus: null },
    }))
    try {
      const result = await videoService.uploadVideo(courseId, lessonId, file, (pct) => {
        setVideoStates((prev) => ({
          ...prev,
          [lessonId]: { ...prev[lessonId], progress: pct },
        }))
      })
      setVideoStates((prev) => ({
        ...prev,
        [lessonId]: { uploading: false, progress: 100, jobId: result.jobId, jobStatus: result.status },
      }))
      toast.success('Upload complete. Processing video…')
    } catch {
      setVideoStates((prev) => ({
        ...prev,
        [lessonId]: { uploading: false, progress: 0, jobId: null, jobStatus: null },
      }))
      toast.error('Upload failed. Please try again.')
    }
  }

  // ── Drag-and-drop sensors ──────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // ── DnD handlers ──────────────────────────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragItem(event.active)
    if (event.active.data.current?.type === 'lesson') {
      dragStartModuleId.current = event.active.data.current.moduleId as string
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeType = active.data.current?.type
    if (activeType !== 'lesson') return

    const overType = over.data.current?.type
    if (overType !== 'lesson') return // only cross-module when over another lesson

    const activeId = active.id as string
    const overId   = over.id as string

    // Find current modules using localModules (handles mid-drag state)
    const activeModule = localModules.find((m) => m.lessons.some((l) => l.lessonId === activeId))
    const overModule   = localModules.find((m) => m.lessons.some((l) => l.lessonId === overId))

    if (!activeModule || !overModule) return
    if (activeModule.moduleId === overModule.moduleId) return // same module — sortable handles it

    // Move lesson to overModule at the overLesson's position
    const movingLesson = activeModule.lessons.find((l) => l.lessonId === activeId)!
    const overIndex    = overModule.lessons.findIndex((l) => l.lessonId === overId)

    setLocalModules((prev) =>
      prev.map((m) => {
        if (m.moduleId === activeModule.moduleId) {
          return {
            ...m,
            lessons: m.lessons
              .filter((l) => l.lessonId !== activeId)
              .map((l, i) => ({ ...l, order: i + 1 })),
          }
        }
        if (m.moduleId === overModule.moduleId) {
          const newLessons = [...m.lessons]
          newLessons.splice(overIndex, 0, movingLesson)
          return {
            ...m,
            lessons: newLessons.map((l, i) => ({ ...l, order: i + 1 })),
          }
        }
        return m
      }),
    )
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDragItem(null)

    if (!over) {
      dragStartModuleId.current = null
      return
    }

    const activeType = active.data.current?.type
    const activeId   = active.id as string

    // ── Module reorder ────────────────────────────────────────────────────
    if (activeType === 'module') {
      const oldIdx = localModules.findIndex((m) => m.moduleId === activeId)
      const newIdx = localModules.findIndex((m) => m.moduleId === over.id)

      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        const reordered = arrayMove(localModules, oldIdx, newIdx).map((m, i) => ({
          ...m,
          order: i + 1,
        }))
        setLocalModules(reordered)
        reorderModulesMutation.mutate(reordered.map((m) => ({ moduleId: m.moduleId, order: m.order })))
      }

      dragStartModuleId.current = null
      return
    }

    // ── Lesson reorder / move ─────────────────────────────────────────────
    if (activeType === 'lesson') {
      const startModId   = dragStartModuleId.current
      const finalModule  = localModules.find((m) => m.lessons.some((l) => l.lessonId === activeId))

      if (!finalModule) {
        dragStartModuleId.current = null
        return
      }

      if (finalModule.moduleId !== startModId) {
        // Cross-module move — localModules already reflects new position from onDragOver
        const lesson = finalModule.lessons.find((l) => l.lessonId === activeId)!
        moveLessonMutation.mutate({
          sourceModuleId: startModId!,
          lessonId: activeId,
          targetModuleId: finalModule.moduleId,
          newOrder: lesson.order,
        })
        // Normalize source module orders on backend
        const sourceModule = localModules.find((m) => m.moduleId === startModId)
        if (sourceModule && sourceModule.lessons.length > 0) {
          reorderLessonsMutation.mutate({
            moduleId: startModId!,
            items: sourceModule.lessons.map((l, i) => ({ lessonId: l.lessonId, order: i + 1 })),
          })
        }
      } else {
        // Same-module reorder — apply arrayMove
        const overType = over.data.current?.type
        if (overType !== 'lesson') {
          dragStartModuleId.current = null
          return
        }
        const overId = over.id as string
        const oldIdx = finalModule.lessons.findIndex((l) => l.lessonId === activeId)
        const newIdx = finalModule.lessons.findIndex((l) => l.lessonId === overId)

        if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
          const reordered = arrayMove(finalModule.lessons, oldIdx, newIdx).map((l, i) => ({
            ...l,
            order: i + 1,
          }))
          setLocalModules((prev) =>
            prev.map((m) =>
              m.moduleId === finalModule.moduleId ? { ...m, lessons: reordered } : m,
            ),
          )
          reorderLessonsMutation.mutate({
            moduleId: finalModule.moduleId,
            items: reordered.map((l) => ({ lessonId: l.lessonId, order: l.order })),
          })
        }
      }

      dragStartModuleId.current = null
    }
  }

  // ── Active drag item for overlay ───────────────────────────────────────────
  const activeDragType   = activeDragItem?.data.current?.type
  const activeDragModule = activeDragType === 'module'
    ? localModules.find((m) => m.moduleId === activeDragItem?.id)
    : null
  const activeDragLesson = activeDragType === 'lesson'
    ? localModules.flatMap((m) => m.lessons).find((l) => l.lessonId === activeDragItem?.id)
    : null

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading || !course) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center items-center h-96">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  const statusLabel = STATUS_LABELS[course.status] ?? 'Draft'
  const statusColor = STATUS_COLORS[course.status] ?? STATUS_COLORS[0]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push('/instructor')}
              className="text-subtle hover:text-text transition-colors shrink-0"
            >
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

        {/* ── Details tab ── */}
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
                <textarea
                  suppressHydrationWarning
                  value={desc}
                  onChange={(e) => { setDesc(e.target.value); setDirty(true) }}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={isFree}
                        onChange={(e) => { setIsFree(e.target.checked); setDirty(true) }}
                      />
                      <div className="w-9 h-5 bg-border rounded-full transition-all peer-checked:bg-success after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                    </div>
                    <span className="text-sm text-text">Free course</span>
                  </label>
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

            {/* Thumbnail */}
            <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-text">Course Thumbnail</h3>
              <div className="flex items-start gap-4">
                <div className="w-32 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                  {thumbnailUrl ? (
                    <img
                      src={`${BASE_URL}${thumbnailUrl}`}
                      alt="Thumbnail"
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <svg className="w-8 h-8 text-primary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-subtle">JPG, PNG, or WebP. Recommended: 1280×720.</p>
                  <button
                    type="button"
                    disabled={thumbnailUploading}
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-subtle hover:text-text hover:bg-surface-hover transition-colors disabled:opacity-50"
                  >
                    {thumbnailUploading ? 'Uploading…' : thumbnailUrl ? 'Replace thumbnail' : 'Upload thumbnail'}
                  </button>
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleThumbnailUpload(file)
                      e.target.value = ''
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Modules tab ── */}
        {tab === 'modules' && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-4">
              {localModules.length === 0 && (
                <div className="py-12 text-center bg-surface border border-border rounded-2xl">
                  <p className="text-subtle text-sm">No modules yet. Add one below.</p>
                </div>
              )}

              <SortableContext
                items={localModules.map((m) => m.moduleId)}
                strategy={verticalListSortingStrategy}
              >
                {localModules.map((mod) => (
                  <SortableModuleCard
                    key={mod.moduleId}
                    mod={mod}
                    courseId={courseId}
                    expandedLesson={expandedLesson}
                    videoStates={videoStates}
                    newLessonTitle={newLessonTitle}
                    addLessonPending={addLessonMutation.isPending}
                    deleteLessonPending={deleteLessonMutation.isPending}
                    onDeleteModule={(moduleId) => deleteModuleMutation.mutate(moduleId)}
                    onAddLesson={(moduleId, lessonTitle, order) =>
                      addLessonMutation.mutate({ moduleId, lessonTitle, order })
                    }
                    onNewLessonTitleChange={(moduleId, value) =>
                      setNewLessonTitle((prev) => ({ ...prev, [moduleId]: value }))
                    }
                    onToggleLesson={(lessonId) =>
                      setExpandedLesson((prev) => (prev === lessonId ? null : lessonId))
                    }
                    onSaveLesson={(moduleId, lessonId, data) =>
                      updateLessonMutation.mutate({ moduleId, lessonId, data })
                    }
                    onDeleteLesson={(moduleId, lessonId) =>
                      deleteLessonMutation.mutate({ moduleId, lessonId })
                    }
                    onUpload={handleVideoUpload}
                  />
                ))}
              </SortableContext>

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

            {/* Drag overlay */}
            <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
              {activeDragModule && <ModuleDragOverlay mod={activeDragModule} />}
              {activeDragLesson && <LessonDragOverlay lesson={activeDragLesson} />}
            </DragOverlay>
          </DndContext>
        )}
      </main>
    </div>
  )
}
