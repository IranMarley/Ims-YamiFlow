import React from 'react'
import {
  View, Text, ScrollView, StyleSheet, Pressable,  Image,
} from 'react-native'
import { router } from 'expo-router'
import { useAuthStore } from '../../store/authStore'
import { useMyEnrollments } from '../../hooks/useEnrollments'
import { useCourses } from '../../hooks/useCourses'
import { useSubscription } from '../../hooks/useSubscription'
import { BASE_URL } from '../../lib/axios'
import CourseCard from '../../components/CourseCard'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { colors, fontSize, fontWeight, spacing, radius } from '../../lib/theme'
import type { Enrollment } from '../../types/enrollment'

function EnrollmentCard({ e }: { e: Enrollment }) {
  return (
    <Pressable
      style={styles.enrollCard}
      onPress={() => router.push(`/learn/${e.courseId}`)}
    >
      <View style={[styles.enrollThumb, { backgroundColor: colors.primary + '22' }]}>
        {e.courseThumbnail ? (
          <Image
            source={{ uri: `${BASE_URL}${e.courseThumbnail}` }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <Text style={{ fontSize: 24 }}>📚</Text>
        )}
      </View>
      <View style={styles.enrollInfo}>
        <Text style={styles.enrollTitle} numberOfLines={2}>{e.courseTitle}</Text>
        <View style={styles.progressRow}>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${e.progressPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(e.progressPercent)}%</Text>
        </View>
        <Text style={styles.progressSub}>{e.completedLessons}/{e.totalLessons} lessons</Text>
      </View>
    </Pressable>
  )
}

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user)
  const { data: enrollments, isLoading: enrollLoading } = useMyEnrollments()
  const { data: courses, isLoading: coursesLoading } = useCourses({ pageSize: 4 })
  const { data: subscription } = useSubscription()

  const inProgress = enrollments?.items.filter(
    (e) => e.progressPercent > 0 && e.progressPercent < 100,
  ) ?? []

  return (
    <ScrollView
      style={styles.bg}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.welcomeRow}>
        <View>
          <Text style={styles.greeting}>Good day, {user?.fullName?.split(' ')[0] ?? 'learner'} 👋</Text>
          <Text style={styles.greetingSub}>Keep the momentum going!</Text>
        </View>
        {subscription?.grantsAccess ? (
          <Badge variant="primary">{subscription.planName}</Badge>
        ) : null}
      </View>

      {/* Subscription CTA */}
      {!subscription?.grantsAccess && (
        <Pressable
          style={styles.subBanner}
          onPress={() => router.push('/subscriptions')}
        >
          <Text style={styles.subBannerTitle}>Unlock all courses</Text>
          <Text style={styles.subBannerSub}>Get unlimited access with a subscription.</Text>
          <Text style={styles.subBannerCta}>View plans →</Text>
        </Pressable>
      )}

      {/* In-progress */}
      {inProgress.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Continue learning</Text>
          {inProgress.map((e) => <EnrollmentCard key={e.enrollmentId} e={e} />)}
        </View>
      )}

      {/* Featured courses */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured courses</Text>
          <Pressable onPress={() => router.push('/(tabs)/courses/')}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>
        {coursesLoading ? (
          <Spinner />
        ) : (
          <View style={styles.grid}>
            {courses?.pages[0]?.items.map((c, i) => (
              <CourseCard key={c.courseId} course={c} index={i} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.xxl, paddingBottom: spacing.xxxl },
  welcomeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  greetingSub: { fontSize: fontSize.sm, color: colors.subtle, marginTop: 2 },
  subBanner: {
    backgroundColor: `${colors.primary}22`,
    borderWidth: 1,
    borderColor: `${colors.primary}44`,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  subBannerTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  subBannerSub: { fontSize: fontSize.sm, color: colors.subtle },
  subBannerCta: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.primary, marginTop: spacing.xs },
  section: { gap: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  seeAll: { fontSize: fontSize.sm, color: colors.primary },
  grid: { gap: spacing.md },
  enrollCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  enrollThumb: { width: 88, alignItems: 'center', justifyContent: 'center' },
  enrollInfo: { flex: 1, padding: spacing.md, gap: spacing.sm },
  enrollTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  progressBg: { flex: 1, height: 4, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: colors.primary, borderRadius: radius.full },
  progressText: { fontSize: fontSize.xs, color: colors.primary, fontWeight: fontWeight.semibold },
  progressSub: { fontSize: fontSize.xs, color: colors.subtle },
})
