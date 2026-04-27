import React, { useState } from 'react'
import { View, Text, FlatList, TextInput, StyleSheet, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useCourses } from '../../../hooks/useCourses'
import CourseCard from '../../../components/CourseCard'
import Spinner from '../../../components/ui/Spinner'
import EmptyState from '../../../components/ui/EmptyState'
import { colors, fontSize, fontWeight, spacing, radius } from '../../../lib/theme'

const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'] as const
type Level = typeof LEVELS[number]

export default function CoursesScreen() {
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState<Level>('All')

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useCourses({
    search: search.trim() || undefined,
    level: level === 'All' ? undefined : level,
    pageSize: 10,
  })

  const allItems = data?.pages?.flatMap((p) => p.items) ?? []

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={colors.subtle} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search courses…"
          placeholderTextColor={colors.subtle}
          value={search}
          onChangeText={(t) => { setSearch(t) }}
          returnKeyType="search"
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.subtle} />
          </Pressable>
        )}
      </View>

      {/* Level filter */}
      <View style={styles.filterRow}>
        {LEVELS.map((l) => (
          <Pressable
            key={l}
            onPress={() => { setLevel(l) }}
            style={[styles.filterBtn, level === l && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, level === l && styles.filterTextActive]}>{l}</Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <Spinner fullScreen />
      ) : (
        <FlatList
          data={allItems}
          keyExtractor={(item) => item.courseId}
          renderItem={({ item, index }) => <CourseCard course={item} index={index} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListEmptyComponent={
            <EmptyState
              icon="🔍"
              title="No courses found"
              description="Try different search terms or filters."
            />
          }
          ListFooterComponent={
            hasNextPage ? (
              <Pressable
                style={styles.loadMore}
                onPress={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? <Spinner /> : <Text style={styles.loadMoreText}>Load more</Text>}
              </Pressable>
            ) : null
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: fontSize.md, color: colors.text },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  filterBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: colors.subtle },
  filterTextActive: { color: colors.white },
  list: { padding: spacing.lg, paddingTop: 0 },
  loadMore: { alignItems: 'center', paddingVertical: spacing.lg },
  loadMoreText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.medium },
})
