import React from 'react'
import {
  View, Text, FlatList, StyleSheet, Image, Pressable,  Alert,
} from 'react-native'
import { router } from 'expo-router'
import { useMyEnrollments, useCancelEnrollment } from '../../hooks/useEnrollments'
import { BASE_URL } from '../../lib/axios'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import { colors, fontSize, fontWeight, spacing, radius } from '../../lib/theme'
import type { Enrollment } from '../../types/enrollment'

const STATUS_MAP: Record<number, string> = { 0: 'active', 1: 'completed', 2: 'cancelled' }

function normalizeStatus(status: string | number | undefined | null): string {
  if (typeof status === 'number') return STATUS_MAP[status] ?? ''
  return String(status ?? '').toLowerCase()
}

function statusColor(status: string | number | undefined | null): string {
  switch (normalizeStatus(status)) {
    case 'active': return colors.success
    case 'completed': return colors.primary
    case 'cancelled': return colors.danger
    default: return colors.subtle
  }
}

function EnrollmentItem({ item }: { item: Enrollment }) {
  const cancel = useCancelEnrollment()

  const handleCancel = () => {
    Alert.alert(
      'Cancel enrollment',
      'Are you sure you want to cancel this enrollment?',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel enrollment',
          style: 'destructive',
          onPress: () => cancel.mutate(item.enrollmentId),
        },
      ],
    )
  }

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => router.push(`/learn/${item.courseId}`)}
        style={styles.cardTop}
      >
        <View style={styles.thumb}>
          {item.courseThumbnail ? (
            <Image
              source={{ uri: `${BASE_URL}${item.courseThumbnail}` }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            <Text style={{ fontSize: 28 }}>📚</Text>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.courseTitle} numberOfLines={2}>{item.courseTitle}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor(item.status) }]} />
            <Text style={[styles.status, { color: statusColor(item.status) }]}>{normalizeStatus(item.status)}</Text>
          </View>
          <View style={styles.progressRow}>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${item.progressPercent}%` }]} />
            </View>
            <Text style={styles.progressPct}>{Math.round(item.progressPercent)}%</Text>
          </View>
          <Text style={styles.lessons}>{item.completedLessons}/{item.totalLessons} lessons</Text>
        </View>
      </Pressable>

      <View style={styles.cardActions}>
        <Button size="sm" onPress={() => router.push(`/learn/${item.courseId}`)}>
          {item.progressPercent === 0 ? 'Start' : item.progressPercent === 100 ? 'Review' : 'Continue'}
        </Button>
        {item.progressPercent < 100 && normalizeStatus(item.status) === 'active' && (
          <Button size="sm" variant="danger" onPress={handleCancel} loading={cancel.isPending}>
            Cancel
          </Button>
        )}
      </View>
    </View>
  )
}

export default function MyLearningScreen() {
  const { data, isLoading } = useMyEnrollments()

  if (isLoading) return <Spinner fullScreen />

  return (
    <FlatList
      data={data?.items ?? []}
      keyExtractor={(item) => item.enrollmentId}
      renderItem={({ item }) => <EnrollmentItem item={item} />}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      style={styles.bg}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      ListEmptyComponent={
        <EmptyState
          icon="📚"
          title="No enrollments yet"
          description="Browse courses and start learning today."
          actionLabel="Browse Courses"
          onAction={() => router.push('/(tabs)/courses/')}
        />
      }
    />
  )
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardTop: { flexDirection: 'row', padding: spacing.md, gap: spacing.md },
  thumb: { width: 80, height: 80, borderRadius: radius.md, overflow: 'hidden', backgroundColor: `${colors.primary}22`, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: spacing.xs },
  courseTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  status: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  progressBg: { flex: 1, height: 4, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: colors.primary, borderRadius: radius.full },
  progressPct: { fontSize: fontSize.xs, color: colors.primary, fontWeight: fontWeight.semibold },
  lessons: { fontSize: fontSize.xs, color: colors.subtle },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    paddingTop: 0,
  },
})
