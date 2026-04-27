import React, { forwardRef, useState } from 'react'
import { View, Text, TextInput, Pressable,  StyleSheet, TextInputProps } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, fontSize, fontWeight, spacing } from '../../lib/theme'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  secureToggle?: boolean
}

const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, secureToggle, secureTextEntry, style, ...props }, ref) => {
    const [hidden, setHidden] = useState(secureTextEntry ?? false)

    return (
      <View style={styles.wrapper}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View style={[styles.inputRow, error ? styles.inputError : null]}>
          <TextInput
            ref={ref}
            style={[styles.input, style]}
            placeholderTextColor={colors.subtle}
            secureTextEntry={hidden}
            autoCapitalize="none"
            autoCorrect={false}
            {...props}
          />
          {secureToggle && (
            <Pressable onPress={() => setHidden((h) => !h)} style={styles.eyeBtn}>
              <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.subtle} />
            </Pressable>
          )}
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    )
  },
)

Input.displayName = 'Input'
export default Input

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  inputError: { borderColor: colors.danger },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  eyeBtn: { paddingLeft: spacing.sm },
  errorText: { fontSize: fontSize.xs, color: colors.danger },
})
