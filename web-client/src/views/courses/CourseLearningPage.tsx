'use client'
import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCourse } from '../../hooks/useCourses'
import { useMyEnrolledCourseIds, useEnrollmentForCourse, useEnrollmentProgress, useIssueCertificate, useEnrollmentCertificate } from '../../hooks/useEnrollments'
import { useAuthStore } from '../../store/authStore'
import Header from '../../components/layout/Header'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import { api } from '../../lib/axios'
import type { LessonDetail, ModuleDetail } from '../../types/course'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

function formatDuration(seconds: number): string {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function CourseLearningPage() {
  const params = useParams(); const courseId = (params?.id as string) ?? ''
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const { data: course, isLoading: courseLoading } = useCourse(courseId ?? '')
  const { data: enrolledIds, isLoading: enrollLoading } = useMyEnrolledCourseIds()
  const { data: enrollment } = useEnrollmentForCourse(courseId ?? '')
  const { data: progress } = useEnrollmentProgress(enrollment?.enrollmentId)

  const [activeLesson, setActiveLesson] = useState<LessonDetail | null>(null)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [hlsLevels, setHlsLevels] = useState<{ height: number }[]>([])
  const [selectedLevel, setSelectedLevel] = useState<number>(-1)
  const videoRef = useRef<HTMLVideoElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hlsRef = useRef<any>(null)

  const issueCertificateMutation = useIssueCertificate()
  const { data: existingCertificate, refetch: refetchCertificate } = useEnrollmentCertificate(enrollment?.enrollmentId)

  const isEnrolled = enrolledIds?.includes(courseId ?? '')
  const isStudent = !user?.role || user.role === 'Student'

  // Derive lesson access before early returns so hooks that depend on these run unconditionally
  const modules: ModuleDetail[] = (course?.modules ?? []) as ModuleDetail[]
  const allLessons = modules.flatMap((m) => m.lessons)
  const canAccessLesson = (lesson: LessonDetail) =>
    lesson.isFreePreview || (isStudent && !!isEnrolled)
  const currentLesson = activeLesson ?? allLessons.find(canAccessLesson) ?? null

  // Populate completed IDs and auto-select first incomplete lesson once progress loads
  useEffect(() => {
    if (!progress || allLessons.length === 0) return
    const doneIds = new Set(
      progress.lessons.filter((l) => l.completed).map((l) => l.lessonId)
    )
    setCompletedIds(doneIds)
    // Only auto-select if user hasn't already clicked a lesson
    if (activeLesson === null) {
      const nextLesson =
        allLessons.find((l) => canAccessLesson(l) && !doneIds.has(l.lessonId)) ??
        allLessons.find(canAccessLesson) ??
        null
      setActiveLesson(nextLesson)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress])

  const completeLessonMutation = useMutation({
    mutationFn: async ({ enrollmentId, lessonId }: { enrollmentId: string; lessonId: string }) => {
      await api.post(`/api/enrollments/${enrollmentId}/lessons/${lessonId}/complete`)
    },
    onSuccess: (_data, vars) => {
      setCompletedIds((prev) => new Set(prev).add(vars.lessonId))
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
      toast.success('Lesson completed!')
    },
  })

  useEffect(() => {
    if (!currentLesson?.hasVideo || !videoRef.current) return
    const manifestUrl = `${API_BASE}/api/lessons/${currentLesson.lessonId}/video/manifest`
    const { accessToken } = useAuthStore.getState()
    let destroyed = false

    setHlsLevels([])
    setSelectedLevel(-1)

    import('hls.js').then(({ default: Hls }) => {
      if (destroyed || !videoRef.current) return
      if (Hls.isSupported()) {
        if (hlsRef.current) hlsRef.current.destroy()
        const hls = new Hls({
          xhrSetup: (xhr: XMLHttpRequest) => {
            if (accessToken) xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)
          },
        })
        hlsRef.current = hls
        hls.loadSource(manifestUrl)
        hls.attachMedia(videoRef.current)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        hls.on(Hls.Events.MANIFEST_PARSED, (_: any, data: any) => {
          if (!destroyed) setHlsLevels(data.levels.map((l: { height: number }) => ({ height: l.height })))
        })
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = manifestUrl
      }
    })

    return () => {
      destroyed = true
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLesson?.lessonId])

  const handleQualityChange = (levelIndex: number) => {
    setSelectedLevel(levelIndex)
    if (hlsRef.current) hlsRef.current.currentLevel = levelIndex
  }

  if (courseLoading || enrollLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-96"><Spinner size="lg" /></div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <h2 className="text-xl font-semibold text-text mb-2">Course not found</h2>
          <Button onClick={() => router.push('/courses')}>Browse Courses</Button>
        </div>
      </div>
    )
  }

  const handleComplete = () => {
    if (!currentLesson || !enrollment) return
    completeLessonMutation.mutate({ enrollmentId: enrollment.enrollmentId, lessonId: currentLesson.lessonId })
  }

  const isCourseComplete =
    allLessons.length > 0 &&
    isStudent &&
    !!isEnrolled &&
    allLessons.every((l) => completedIds.has(l.lessonId))

  const handleGenerateCertificate = async () => {
    if (!enrollment) return
    try {
      await issueCertificateMutation.mutateAsync(enrollment.enrollmentId)
      await refetchCertificate()
      toast.success('Certificate generated!')
    } catch {
      toast.error('Failed to generate certificate.')
    }
  }

  const certificate = existingCertificate ?? null

  const currentModuleIdx = modules.findIndex((m) =>
    m.lessons.some((l) => l.lessonId === currentLesson?.lessonId)
  )
  const currentLessonIdx = currentModuleIdx >= 0
    ? modules[currentModuleIdx].lessons.findIndex((l) => l.lessonId === currentLesson?.lessonId)
    : -1

  const goToNext = () => {
    if (currentModuleIdx < 0 || currentLessonIdx < 0) return
    const currentMod = modules[currentModuleIdx]
    if (currentLessonIdx < currentMod.lessons.length - 1) {
      const next = currentMod.lessons[currentLessonIdx + 1]
      if (canAccessLesson(next)) setActiveLesson(next)
    } else if (currentModuleIdx < modules.length - 1) {
      const nextMod = modules[currentModuleIdx + 1]
      const first = nextMod.lessons[0]
      if (first && canAccessLesson(first)) setActiveLesson(first)
    }
  }

  const goToPrev = () => {
    if (currentModuleIdx < 0 || currentLessonIdx < 0) return
    if (currentLessonIdx > 0) {
      const prev = modules[currentModuleIdx].lessons[currentLessonIdx - 1]
      if (canAccessLesson(prev)) setActiveLesson(prev)
    } else if (currentModuleIdx > 0) {
      const prevMod = modules[currentModuleIdx - 1]
      const last = prevMod.lessons[prevMod.lessons.length - 1]
      if (last && canAccessLesson(last)) setActiveLesson(last)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-subtle mb-5">
          <button onClick={() => router.push('/courses')} className="hover:text-text transition-colors">Courses</button>
          <span>/</span>
          <button onClick={() => router.push(`/courses/${courseId}`)} className="hover:text-text transition-colors truncate max-w-xs">{course.title}</button>
          <span>/</span>
          <span className="text-text">Learn</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Lesson content */}
          <div className="lg:col-span-3 space-y-4">
            {currentLesson ? (
              <>
                {/* Video / content area */}
                <div className="rounded-2xl bg-surface border border-border overflow-hidden">
                  {currentLesson.hasVideo ? (
                    <>
                      <div className="aspect-video bg-black">
                        <video
                          ref={videoRef}
                          className="w-full h-full"
                          controls
                          playsInline
                        />
                      </div>
                      {hlsLevels.length > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 border-t border-border bg-surface">
                          <span className="text-xs text-subtle shrink-0">Quality:</span>
                          <button
                            onClick={() => handleQualityChange(-1)}
                            className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                              selectedLevel === -1 ? 'bg-primary text-white' : 'text-subtle hover:text-text hover:bg-surface-hover'
                            }`}
                          >
                            Auto
                          </button>
                          {hlsLevels.map((lvl, i) => (
                            <button
                              key={i}
                              onClick={() => handleQualityChange(i)}
                              className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                                selectedLevel === i ? 'bg-primary text-white' : 'text-subtle hover:text-text hover:bg-surface-hover'
                              }`}
                            >
                              {lvl.height}p
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : currentLesson.contentUrl && (currentLesson.contentUrl.startsWith('http://') || currentLesson.contentUrl.startsWith('https://')) ? (
                    <div className="aspect-video">
                      <iframe
                        src={currentLesson.contentUrl}
                        className="w-full h-full"
                        allow="autoplay; fullscreen"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-primary/10 to-background">
                      <div className="text-center">
                        <svg className="w-16 h-16 text-primary/30 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-subtle text-sm">No content configured for this lesson</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Lesson info */}
                <div className="bg-surface border border-border rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h2 className="text-lg font-semibold text-text">{currentLesson.title}</h2>
                      {currentLesson.durationSeconds > 0 && (
                        <p className="text-sm text-subtle mt-0.5">{formatDuration(currentLesson.durationSeconds)}</p>
                      )}
                      {currentLesson.isFreePreview && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-success/10 text-success">Free Preview</span>
                      )}
                    </div>

                    {isStudent && isEnrolled && (
                      <div className="flex gap-2">
                        {completedIds.has(currentLesson.lessonId) ? (
                          <span className="flex items-center gap-1.5 text-sm text-success">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Completed
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={completeLessonMutation.isPending}
                            onClick={handleComplete}
                          >
                            Mark as complete
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                    <Button size="sm" variant="secondary" onClick={goToPrev}>← Previous</Button>
                    <Button size="sm" variant="secondary" onClick={goToNext}>Next →</Button>
                  </div>
                </div>

                {/* Certificate banner */}
                {isCourseComplete && (
                  <div className="bg-surface border border-success/30 rounded-2xl p-5">
                    <div className="flex items-start gap-4 flex-wrap">
                      <div className="shrink-0 w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-text">Course completed!</h3>
                        <p className="text-xs text-subtle mt-0.5">
                          You have completed all lessons. Generate your certificate of completion.
                        </p>
                        {certificate && (
                          <div className="mt-3 p-3 bg-success/5 border border-success/20 rounded-xl text-xs space-y-1">
                            <p className="text-success font-medium">Certificate issued</p>
                            <p className="text-subtle">
                              Code: <span className="font-mono text-text select-all">{certificate.code}</span>
                            </p>
                            <p className="text-subtle">
                              Issued:{' '}
                              {new Date(certificate.issuedAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                      {!certificate && (
                        <Button
                          size="sm"
                          variant="primary"
                          loading={issueCertificateMutation.isPending}
                          onClick={handleGenerateCertificate}
                        >
                          Generate certificate
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-surface border border-border rounded-2xl p-12 text-center">
                <p className="text-subtle">
                  {isStudent && !isEnrolled
                    ? 'Enroll in this course to access all lessons.'
                    : 'No lessons available yet.'}
                </p>
                {isStudent && !isEnrolled && (
                  <Button className="mt-4" onClick={() => router.push(`/courses/${courseId}`)}>
                    Enroll Now
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Sidebar: course outline */}
          <div className="lg:col-span-1">
            <div className="bg-surface border border-border rounded-2xl overflow-hidden sticky top-24">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-text text-sm">Course Content</h3>
                <p className="text-xs text-subtle mt-0.5">{allLessons.length} lessons</p>
              </div>
              <div className="overflow-y-auto max-h-[70vh]">
                {modules.map((mod) => (
                  <div key={mod.moduleId}>
                    <div className="px-4 py-2.5 bg-background/50 border-b border-border/50">
                      <p className="text-xs font-semibold text-text uppercase tracking-wide">{mod.title}</p>
                    </div>
                    {mod.lessons.map((lesson) => {
                      const accessible = canAccessLesson(lesson)
                      const isActive = currentLesson?.lessonId === lesson.lessonId
                      const isCompleted = completedIds.has(lesson.lessonId)
                      return (
                        <button
                          key={lesson.lessonId}
                          disabled={!accessible}
                          onClick={() => accessible && setActiveLesson(lesson)}
                          className={`w-full text-left px-4 py-3 flex items-start gap-2.5 border-b border-border/30 transition-colors ${
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : accessible
                              ? 'hover:bg-surface-hover/50 text-text'
                              : 'opacity-40 cursor-not-allowed text-subtle'
                          }`}
                        >
                          <span className="mt-0.5 shrink-0">
                            {isCompleted ? (
                              <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : lesson.isFreePreview ? (
                              <svg className="w-4 h-4 text-success/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              </svg>
                            ) : accessible ? (
                              <svg className="w-4 h-4 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs leading-snug line-clamp-2">{lesson.title}</p>
                            {lesson.durationSeconds > 0 && (
                              <p className="text-xs text-subtle mt-0.5">{formatDuration(lesson.durationSeconds)}</p>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
