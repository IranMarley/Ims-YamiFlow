import React from 'react'
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useChangePassword } from '../hooks/useAuth'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import ScreenHeader from '../components/ui/ScreenHeader'
import { colors, fontSize, fontWeight, spacing } from '../lib/theme'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
type FormData = z.infer<typeof schema>

export default function ChangePasswordScreen() {
  const changePassword = useChangePassword()
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = ({ currentPassword, newPassword }: FormData) => {
    changePassword.mutate({ currentPassword, newPassword }, {
      onSuccess: () => {
        reset()
        router.back()
      },
    })
  }

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Change Password" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <Controller
            control={control}
            name="currentPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Current password"
                placeholder="Current password"
                secureTextEntry
                secureToggle
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.currentPassword?.message}
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
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirm new password"
                placeholder="Repeat new password"
                secureTextEntry
                secureToggle
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <Button onPress={handleSubmit(onSubmit)} loading={changePassword.isPending} fullWidth>
            Change Password
          </Button>
          <Button variant="ghost" onPress={() => router.back()} fullWidth>
            Cancel
          </Button>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: spacing.xl, gap: spacing.xl },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text },
  form: { gap: spacing.lg },
})
