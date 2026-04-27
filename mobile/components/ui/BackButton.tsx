import React from 'react'
import { TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius } from '../../lib/theme'

export default function BackButton() {
  return (
    <TouchableOpacity
      onPress={() => router.back()}
      //style={styles.btn}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="arrow-back" size={22} color={colors.text} />
    </TouchableOpacity>
  )
}

// const styles = StyleSheet.create({
//   btn: {
//     width: 40,
//     height: 40,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderRadius: radius.md,
//     backgroundColor: colors.surface,
//   },
// })
