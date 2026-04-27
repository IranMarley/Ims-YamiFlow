import React from 'react'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { colors } from '../../lib/theme'

interface SpinnerProps {
  size?: 'small' | 'large'
  fullScreen?: boolean
  color?: string
}

export default function Spinner({ size = 'small', fullScreen = false, color = colors.primary }: SpinnerProps) {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size={size} color={color} />
      </View>
    )
  }
  return <ActivityIndicator size={size} color={color} />
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
})
