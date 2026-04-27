import React, { useEffect } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useConfirmEmail } from '../../hooks/useAuth'
import Button from '../../components/ui/Button'
import ScreenHeader from '../../components/ui/ScreenHeader'
import { colors, fontSize, fontWeight, spacing } from '../../lib/theme'

export default function ConfirmEmailScreen() {
  const { email = '', token = '' } = useLocalSearchParams<{ email?: string; token?: string }>()
  const confirmEmail = useConfirmEmail()

  useEffect(() => {
    if (email && token) {
      confirmEmail.mutate({ email, token })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <View style={styles.outer}>
      <ScreenHeader title="Confirm Email" />
    <View style={styles.container}>
      {confirmEmail.isPending && (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.text}>Confirming your email…</Text>
        </>
      )}

      {confirmEmail.isSuccess && (
        <>
          <Text style={styles.icon}>✅</Text>
          <Text style={styles.title}>Email confirmed!</Text>
          <Text style={styles.subtitle}>Your account is ready. Sign in to get started.</Text>
          <Button onPress={() => router.replace('/(auth)/login')}>Sign In</Button>
        </>
      )}

      {confirmEmail.isError && (
        <>
          <Text style={styles.icon}>❌</Text>
          <Text style={styles.title}>Confirmation failed</Text>
          <Text style={styles.subtitle}>The link may have expired. Request a new one.</Text>
          <Button onPress={() => router.replace('/(auth)/login')}>Back to Login</Button>
        </>
      )}

      {!email || !token ? (
        <>
          <Text style={styles.title}>Invalid link</Text>
          <Text style={styles.subtitle}>No email or token provided.</Text>
          <Button onPress={() => router.replace('/(auth)/login')}>Back to Login</Button>
        </>
      ) : null}
    </View>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  icon: { fontSize: 48 },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: fontSize.sm, color: colors.subtle, textAlign: 'center', lineHeight: 20 },
  text: { fontSize: fontSize.md, color: colors.subtle },
})
