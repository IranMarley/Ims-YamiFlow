import React from 'react'
import { Pressable,  View, Text, Image, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { colors, radius, fontSize, fontWeight, spacing } from '../lib/theme'
import { BASE_URL } from '../lib/axios'
import Badge from './ui/Badge'
import type { Course } from '../types/course'

const LEVEL_COLORS: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  Beginner: 'success',
  Intermediate: 'warning',
  Advanced: 'danger',
}

const BG_COLORS = ['#4F46E533', '#0891B233', '#059669330', '#D9770633']

interface CourseCardProps {
  course: Course
  index?: number
}

export default function CourseCard({ course, index = 0 }: CourseCardProps) {
  const bg = BG_COLORS[index % BG_COLORS.length]

  return (
    <Pressable
      onPress={() => router.push(`/(tabs)/courses/${course.courseId}`)}
      style={styles.card}
    >
      <View style={[styles.thumbnail, { backgroundColor: bg }]}>
        {course.thumbnail ? (
          <Image
            source={{ uri: `${BASE_URL}${course.thumbnail}` }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.thumbnailPlaceholder}>▶</Text>
        )}
        {course.isFree && (
          <View style={styles.freeBadge}>
            <Text style={styles.freeBadgeText}>Free</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.row}>
          <Badge variant={LEVEL_COLORS[course.level] ?? 'default'}>{course.level}</Badge>
          {!course.isFree && <Text style={styles.premium}>Premium</Text>}
        </View>

        <Text style={styles.title} numberOfLines={2}>{course.title}</Text>
        <Text style={styles.description} numberOfLines={2}>{course.description}</Text>

        <View style={styles.instructor}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{course.instructorName?.[0]?.toUpperCase() ?? 'I'}</Text>
          </View>
          <Text style={styles.instructorName} numberOfLines={1}>{course.instructorName}</Text>
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbnail: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbnailPlaceholder: { fontSize: 40, color: colors.subtle },
  freeBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: `${colors.success}E6`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  freeBadgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.white },
  body: { padding: spacing.lg, gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  premium: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.primary },
  title: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text, lineHeight: 20 },
  description: { fontSize: fontSize.xs, color: colors.subtle, lineHeight: 18 },
  instructor: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: `${colors.primary}33`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 10, fontWeight: fontWeight.bold, color: colors.primary },
  instructorName: { fontSize: fontSize.xs, color: colors.subtle, flex: 1 },
})
