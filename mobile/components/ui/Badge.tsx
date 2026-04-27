import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, radius, fontSize, fontWeight, spacing } from '../../lib/theme'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'primary'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
}

export default function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant]]}>
      <Text style={[styles.text, styles[`text_${variant}`]]}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  default: { backgroundColor: colors.border },
  success: { backgroundColor: `${colors.success}26` },
  warning: { backgroundColor: `${colors.warning}26` },
  danger: { backgroundColor: `${colors.danger}26` },
  primary: { backgroundColor: `${colors.primary}26` },

  text: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  text_default: { color: colors.subtle },
  text_success: { color: colors.success },
  text_warning: { color: colors.warning },
  text_danger: { color: colors.danger },
  text_primary: { color: colors.primary },
})
