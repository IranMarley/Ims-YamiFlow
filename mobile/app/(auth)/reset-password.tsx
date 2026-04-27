import React from 'react'
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useResetPassword } from '../../hooks/useAuth'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import ScreenHeader from '../../components/ui/ScreenHeader'
import { colors, fontSize, fontWeight, spacing } from '../../lib/theme'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})
type FormData = z.infer<typeof schema>

export default function ResetPasswordScreen() {
  const { email = '', token = '' } = useLocalSearchParams<{ email?: string; token?: string }>()
  const resetPassword = useResetPassword()

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email, token },
  })

  const onSubmit = (data: FormData) => {
    resetPassword.mutate(data, {
      onSuccess: () => router.replace('/(auth)/login'),
    })
  }

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Set New Password" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Set new password</Text>
          <Text style={styles.subtitle}>Enter the token from your email and choose a new password.</Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="you@example.com"
                keyboardType="email-address"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.email?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="token"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Reset token"
                placeholder="Token from email"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.token?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="New password"
                placeholder="At least 8 characters"
                secureTextEntry
                secureToggle
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.newPassword?.message}
              />
            )}
          />

          <Button onPress={handleSubmit(onSubmit)} loading={resetPassword.isPending} fullWidth>
            Reset Password
          </Button>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.xxl },
  header: { gap: spacing.sm },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text },
  subtitle: { fontSize: fontSize.sm, color: colors.subtle, lineHeight: 20 },
  form: { gap: spacing.lg },
})
