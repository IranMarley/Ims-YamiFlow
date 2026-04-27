import React, { useState, useEffect } from 'react'
import {
  View, Text, SectionList, StyleSheet, Pressable,  Alert,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useCourse } from '../../hooks/useCourses'
import {
  useMyEnrolledCourseIds,
  useEnrollmentForCourse,
  useEnrollmentProgress,
  useIssueCertificate,
  useEnrollmentCertificate,
  useCompleteLesson,
} from '../../hooks/useEnrollments'
import { useAuthStore } from '../../store/authStore'
import VideoPlayer from '../../components/VideoPlayer'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import BackButton from '../../components/ui/BackButton'
import { colors, fontSize, fontWeight, spacing, radius } from '../../lib/theme'
import type { LessonDetail, ModuleDetail } from '../../types/course'
import Toast from 'react-native-toast-message'

function formatDuration(seconds: number): string {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

type Section = { title: string; moduleId: string; data: LessonDetail[] }

export default function LearnScreen() {
  const insets = useSafeAreaInsets()
  const { id: courseId } = useLocalSearchParams<{ id: string }>()
  const { data: course, isLoading: courseLoading } = useCourse(courseId)
  const { data: enrolledIds, isLoading: enrollLoading } = useMyEnrolledCourseIds()
  const { data: enrollment } = useEnrollmentForCourse(courseId)
  const { data: progress } = useEnrollmentProgress(enrollment?.enrollmentId)
  const { data: existingCert, refetch: refetchCert } = useEnrollmentCertificate(enrollment?.enrollmentId)
  const issueCert = useIssueCertificate()
  const completeLesson = useCompleteLesson()
  const user = useAuthStore((s) => s.user)

  const [activeLesson, setActiveLesson] = useState<LessonDetail | null>(null)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())

  const modules: ModuleDetail[] = (course?.modules ?? []) as ModuleDetail[]
  const allLessons = modules.flatMap((m) => m.lessons)
  const isEnrolled = enrolledIds?.includes(courseId)
  const canAccessLesson = (l: LessonDetail) => l.isFreePreview || !!isEnrolled

  useEffect(() => {
    if (!progress || allLessons.length === 0) return
    const doneIds = new Set(progress.lessons.filter((l) => l.completed).map((l) => l.lessonId))
    setCompletedIds(doneIds)
    if (activeLesson === null) {
      const next =
        allLessons.find((l) => canAccessLesson(l) && !doneIds.has(l.lessonId)) ??
        allLessons.find(canAccessLesson) ??
        null
      setActiveLesson(next)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress])

  if (courseLoading || enrollLoading) return <Spinner fullScreen />

  if (!course) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Course not found</Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </View>
    )
  }

  if (!isEnrolled) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>You are not enrolled in this course.</Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </View>
    )
  }

  const currentLesson = activeLesson ?? allLessons.find(canAccessLesson) ?? null
  const currentModuleIdx = modules.findIndex((m) =>
    m.lessons.some((l) => l.lessonId === currentLesson?.lessonId)
  )
  const currentLessonIdx = currentModuleIdx >= 0
    ? modules[currentModuleIdx].lessons.findIndex((l) => l.lessonId === currentLesson?.lessonId)
    : -1

  const goToNext = () => {
    if (currentModuleIdx < 0 || currentLessonIdx < 0) return
    const mod = modules[currentModuleIdx]
    if (currentLessonIdx < mod.lessons.length - 1) {
      const next = mod.lessons[currentLessonIdx + 1]
      if (canAccessLesson(next)) setActiveLesson(next)
    } else if (currentModuleIdx < modules.length - 1) {
      const first = modules[currentModuleIdx + 1].lessons[0]
      if (first && canAccessLesson(first)) setActiveLesson(first)
    }
  }

  const goToPrev = () => {
    if (currentModuleIdx < 0 || currentLessonIdx < 0) return
    if (currentLessonIdx > 0) {
      const prev = modules[currentModuleIdx].lessons[currentLessonIdx - 1]
      if (canAccessLesson(prev)) setActiveLesson(prev)
    } else if (currentModuleIdx > 0) {
      const last = modules[currentModuleIdx - 1].lessons.at(-1)!
      if (canAccessLesson(last)) setActiveLesson(last)
    }
  }

  const handleComplete = () => {
    if (!currentLesson || !enrollment) return
    completeLesson.mutate(
      { enrollmentId: enrollment.enrollmentId, lessonId: currentLesson.lessonId },
      {
        onSuccess: () => {
          setCompletedIds((prev) => new Set(prev).add(currentLesson.lessonId))
          Toast.show({ type: 'success', text1: 'Lesson completed!' })
        },
      },
    )
  }

  const handleIssueCert = async () => {
    if (!enrollment) return
    try {
      await issueCert.mutateAsync(enrollment.enrollmentId)
      await refetchCert()
      Toast.show({ type: 'success', text1: 'Certificate generated!' })
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to generate certificate' })
    }
  }

  const isCourseComplete =
    allLessons.length > 0 && allLessons.every((l) => completedIds.has(l.lessonId))

  const sections: Section[] = modules.map((mod) => ({
    title: mod.title,
    moduleId: mod.moduleId,
    data: mod.lessons,
  }))

  const lessonHeader = (
    <View>
      {/* Video */}
      {currentLesson?.hasVideo ? (
        <VideoPlayer lessonId={currentLesson.lessonId} />
      ) : (
        <View style={styles.noVideo}>
          <Ionicons name="play-circle-outline" size={48} color={`${colors.primary}55`} />
          <Text style={styles.noVideoText}>No video for this lesson</Text>
        </View>
      )}

      {/* Lesson info */}
      <View style={styles.lessonInfo}>
        <Text style={styles.lessonTitle}>{currentLesson?.title ?? 'Select a lesson'}</Text>
        {currentLesson && currentLesson.durationSeconds > 0 && (
          <Text style={styles.lessonDuration}>{formatDuration(currentLesson.durationSeconds)}</Text>
        )}
        {currentLesson?.isFreePreview && (
          <View style={styles.freePreviewBadge}>
            <Text style={styles.freePreviewText}>Free Preview</Text>
          </View>
        )}

        {/* Nav row */}
        <View style={styles.navRow}>
          <Pressable
            style={[styles.navBtn, currentModuleIdx === 0 && currentLessonIdx === 0 && styles.navBtnDisabled]}
            onPress={goToPrev}
            disabled={currentModuleIdx === 0 && currentLessonIdx === 0}
          >
            <Ionicons name="chevron-back" size={18} color={colors.text} />
            <Text style={styles.navBtnText}>Prev</Text>
          </Pressable>

          {isEnrolled && (
            completedIds.has(currentLesson?.lessonId ?? '') ? (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.completedText}>Completed</Text>
              </View>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onPress={handleComplete}
                loading={completeLesson.isPending}
              >
                Mark complete
              </Button>
            )
          )}

          <Pressable
            style={styles.navBtn}
            onPress={goToNext}
          >
            <Text style={styles.navBtnText}>Next</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </Pressable>
        </View>

        {/* Certificate banner */}
        {isCourseComplete && (
          <View style={styles.certBanner}>
            <Ionicons name="ribbon-outline" size={24} color={colors.success} />
            <View style={styles.certInfo}>
              <Text style={styles.certTitle}>Course completed! 🎉</Text>
              {existingCert ? (
                <>
                  <Text style={styles.certCode}>Code: {existingCert.code}</Text>
                  <Text style={styles.certDate}>
                    Issued {new Date(existingCert.issuedAt).toLocaleDateString()}
                  </Text>
                </>
              ) : (
                <Button size="sm" onPress={handleIssueCert} loading={issueCert.isPending}>
                  Generate Certificate
                </Button>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Section list header */}
      <View style={styles.contentHeader}>
        <Text style={styles.contentHeaderText}>Course Content</Text>
        <Text style={styles.contentHeaderSub}>{allLessons.length} lessons</Text>
      </View>
    </View>
  )

  return (
    <View style={[styles.bg, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle} numberOfLines={1}>{course.title}</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.lessonId}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={lessonHeader}
        renderSectionHeader={({ section }) => (
          <View style={styles.moduleHeader}>
            <Text style={styles.moduleTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item: lesson }) => {
          const accessible = canAccessLesson(lesson)
          const isActive = currentLesson?.lessonId === lesson.lessonId
          const isDone = completedIds.has(lesson.lessonId)

          return (
            <Pressable
              style={[styles.lessonRow, isActive && styles.lessonRowActive]}
              onPress={() => accessible && setActiveLesson(lesson)}
              disabled={!accessible}
            >
              <View style={styles.lessonIcon}>
                {isDone ? (
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                ) : isActive ? (
                  <Ionicons name="play-circle" size={20} color={colors.primary} />
                ) : accessible ? (
                  <Ionicons name="play-circle-outline" size={20} color={colors.subtle} />
                ) : (
                  <Ionicons name="lock-closed-outline" size={18} color={colors.border} />
                )}
              </View>
              <View style={styles.lessonRowInfo}>
                <Text
                  style={[
                    styles.lessonRowTitle,
                    isActive && styles.lessonRowTitleActive,
                    !accessible && styles.lessonRowTitleLocked,
                  ]}
                  numberOfLines={2}
                >
                  {lesson.title}
                </Text>
                {lesson.durationSeconds > 0 && (
                  <Text style={styles.lessonRowDuration}>{formatDuration(lesson.durationSeconds)}</Text>
                )}
              </View>
              {isActive && <View style={styles.activeDot} />}
            </Pressable>
          )
        }}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, backgroundColor: colors.background, padding: spacing.xl },
  errorText: { fontSize: fontSize.lg, color: colors.text },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  headerTitle: { flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },

  noVideo: {
    aspectRatio: 16 / 9,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  noVideoText: { fontSize: fontSize.sm, color: colors.subtle },

  lessonInfo: { padding: spacing.lg, gap: spacing.md },
  lessonTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  lessonDuration: { fontSize: fontSize.sm, color: colors.subtle },
  freePreviewBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.success}22`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  freePreviewText: { fontSize: fontSize.xs, color: colors.success, fontWeight: fontWeight.medium },

  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  navBtnDisabled: { opacity: 0.35 },
  navBtnText: { fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.medium },
  completedBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  completedText: { fontSize: fontSize.sm, color: colors.success, fontWeight: fontWeight.medium },

  certBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: `${colors.success}11`,
    borderWidth: 1,
    borderColor: `${colors.success}44`,
    borderRadius: radius.xl,
  },
  certInfo: { flex: 1, gap: spacing.xs },
  certTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  certCode: { fontSize: fontSize.sm, color: colors.text, fontFamily: 'monospace' },
  certDate: { fontSize: fontSize.xs, color: colors.subtle },

  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  contentHeaderText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  contentHeaderSub: { fontSize: fontSize.sm, color: colors.subtle },

  moduleHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: `${colors.border}66`,
  },
  moduleTitle: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.subtle, textTransform: 'uppercase', letterSpacing: 0.5 },

  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.border}66`,
    backgroundColor: colors.background,
  },
  lessonRowActive: { backgroundColor: `${colors.primary}12` },
  lessonIcon: { width: 24, alignItems: 'center' },
  lessonRowInfo: { flex: 1, gap: 2 },
  lessonRowTitle: { fontSize: fontSize.sm, color: colors.text },
  lessonRowTitleActive: { color: colors.primary, fontWeight: fontWeight.semibold },
  lessonRowTitleLocked: { opacity: 0.4 },
  lessonRowDuration: { fontSize: fontSize.xs, color: colors.subtle },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
})
