import React, { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, Image, Pressable, 
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useCourse } from '../../../hooks/useCourses'
import { useMyEnrolledCourseIds, useEnroll, useEnrollmentForCourse } from '../../../hooks/useEnrollments'
import { useSubscription } from '../../../hooks/useSubscription'
import { useAuthStore } from '../../../store/authStore'
import { BASE_URL } from '../../../lib/axios'
import Spinner from '../../../components/ui/Spinner'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import ScreenHeader from '../../../components/ui/ScreenHeader'
import { colors, fontSize, fontWeight, spacing, radius } from '../../../lib/theme'

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: course, isLoading } = useCourse(id)
  const { data: enrolledIds } = useMyEnrolledCourseIds()
  const { data: enrollment } = useEnrollmentForCourse(id)
  const { data: subscription } = useSubscription()
  const user = useAuthStore((s) => s.user)
  const enroll = useEnroll()
  const [expandedModule, setExpandedModule] = useState<string | null>(null)

  if (isLoading) return <Spinner fullScreen />
  if (!course) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Course not found</Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </View>
    )
  }

  const isEnrolled = enrolledIds?.includes(id)
  const canAccess = course.isFree || subscription?.grantsAccess
  const totalLessons = (course.modules ?? []).flatMap((m) => m.lessons).length

  const handleEnroll = () => {
    if (!user) { router.push('/(auth)/login'); return }
    if (!canAccess && !course.isFree) { router.push('/subscriptions'); return }
    enroll.mutate({ courseId: id }, {
      onSuccess: () => router.push(`/learn/${id}`),
    })
  }

  const handleStartLearning = () => router.push(`/learn/${id}`)

  const LEVEL_COLOR: Record<string, 'success' | 'warning' | 'danger'> = {
    Beginner: 'success', Intermediate: 'warning', Advanced: 'danger',
  }

  return (
    <View style={styles.bg}>
    <ScreenHeader title={course.title} />
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Thumbnail */}
      <View style={styles.thumbnail}>
        {course.thumbnail ? (
          <Image source={{ uri: `${BASE_URL}${course.thumbnail}` }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <Text style={styles.thumbnailPlaceholder}>▶</Text>
        )}
      </View>

      <View style={styles.body}>
        {/* Meta */}
        <View style={styles.metaRow}>
          <Badge variant={LEVEL_COLOR[course.level] ?? 'default'}>{course.level}</Badge>
          {course.isFree
            ? <Badge variant="success">Free</Badge>
            : <Badge variant="primary">Premium</Badge>}
        </View>

        <Text style={styles.title}>{course.title}</Text>
        <Text style={styles.description}>{course.description}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="person-outline" size={14} color={colors.subtle} />
            <Text style={styles.statText}>{course.instructorName}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="library-outline" size={14} color={colors.subtle} />
            <Text style={styles.statText}>{totalLessons} lessons</Text>
          </View>
          {course.enrollmentCount !== undefined && (
            <View style={styles.stat}>
              <Ionicons name="people-outline" size={14} color={colors.subtle} />
              <Text style={styles.statText}>{course.enrollmentCount} enrolled</Text>
            </View>
          )}
        </View>

        {/* CTA */}
        {isEnrolled ? (
          <Button onPress={handleStartLearning} fullWidth>Continue Learning</Button>
        ) : canAccess ? (
          <Button onPress={handleEnroll} loading={enroll.isPending} fullWidth>Enroll Now — Free</Button>
        ) : (
          <View style={styles.ctas}>
            <Button onPress={() => router.push('/subscriptions')} fullWidth>Get Access — Subscribe</Button>
            <Button variant="secondary" onPress={() => router.push('/pricing')} fullWidth>View Plans</Button>
          </View>
        )}

        {/* Curriculum */}
        {(course.modules ?? []).length > 0 && (
          <View style={styles.curriculum}>
            <Text style={styles.curriculumTitle}>Course Content</Text>
            {course.modules!.map((mod) => (
              <View key={mod.moduleId} style={styles.module}>
                <Pressable
                  style={styles.moduleHeader}
                  onPress={() => setExpandedModule(expandedModule === mod.moduleId ? null : mod.moduleId)}
                >
                  <Text style={styles.moduleName}>{mod.title}</Text>
                  <Ionicons
                    name={expandedModule === mod.moduleId ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.subtle}
                  />
                </Pressable>
                {expandedModule === mod.moduleId && (
                  <View style={styles.lessonList}>
                    {mod.lessons.map((lesson) => (
                      <View key={lesson.lessonId} style={styles.lessonRow}>
                        <Ionicons
                          name={lesson.isFreePreview ? 'play-circle-outline' : 'lock-closed-outline'}
                          size={16}
                          color={lesson.isFreePreview ? colors.success : colors.subtle}
                        />
                        <Text style={styles.lessonTitle} numberOfLines={1}>{lesson.title}</Text>
                        {lesson.isFreePreview && (
                          <Text style={styles.freePreviewLabel}>Preview</Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, backgroundColor: colors.background },
  notFound: { fontSize: fontSize.lg, color: colors.text },
  thumbnail: {
    height: 240,
    backgroundColor: `${colors.primary}33`,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbnailPlaceholder: { fontSize: 56, color: colors.subtle },
  body: { padding: spacing.lg, gap: spacing.lg },
  metaRow: { flexDirection: 'row', gap: spacing.sm },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text, lineHeight: 32 },
  description: { fontSize: fontSize.sm, color: colors.subtle, lineHeight: 22 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  stat: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statText: { fontSize: fontSize.xs, color: colors.subtle },
  ctas: { gap: spacing.sm },
  curriculum: { gap: spacing.sm },
  curriculumTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  module: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  moduleName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text, flex: 1 },
  lessonList: { borderTopWidth: 1, borderTopColor: colors.border },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.border}66`,
  },
  lessonTitle: { flex: 1, fontSize: fontSize.sm, color: colors.subtle },
  freePreviewLabel: { fontSize: fontSize.xs, color: colors.success, fontWeight: fontWeight.medium },
})
