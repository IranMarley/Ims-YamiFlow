import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, fontSize, fontWeight, spacing } from '../../lib/theme'
import Button from './Button'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({ icon = '📭', title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <Button onPress={onAction} style={styles.btn}>{actionLabel}</Button>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl, gap: spacing.md },
  icon: { fontSize: 48 },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text, textAlign: 'center' },
  description: { fontSize: fontSize.sm, color: colors.subtle, textAlign: 'center', lineHeight: 20 },
  btn: { marginTop: spacing.sm },
})
