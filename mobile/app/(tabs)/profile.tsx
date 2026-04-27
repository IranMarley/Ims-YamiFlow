import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, StyleSheet, Pressable,  Alert,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../store/authStore'
import { useLogout } from '../../hooks/useAuth'
import { useProfile, useUpdateProfile } from '../../hooks/useProfile'
import { useSubscription } from '../../hooks/useSubscription'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { colors, fontSize, fontWeight, spacing, radius } from '../../lib/theme'
import Toast from 'react-native-toast-message'

function MenuItem({
  icon, label, onPress, danger = false,
}: { icon: string; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <Ionicons name={icon as never} size={20} color={danger ? colors.danger : colors.subtle} />
      <Text style={[styles.menuLabel, danger && { color: colors.danger }]}>{label}</Text>
      {!danger && <Ionicons name="chevron-forward" size={16} color={colors.border} />}
    </Pressable>
  )
}

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const { data: subscription } = useSubscription()

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile?.fullName ?? user?.fullName ?? '')

  useEffect(() => {
    if (profile?.fullName) setName(profile.fullName)
  }, [profile?.fullName])

  const handleSave = () => {
    if (!name.trim()) return
    updateProfile.mutate(name.trim(), {
      onSuccess: () => {
        setEditing(false)
        Toast.show({ type: 'success', text1: 'Profile updated' })
      },
      onError: (err: any) => {
        const msg = err?.response?.data ?? err?.message ?? 'Update failed'
        Toast.show({ type: 'error', text1: 'Error', text2: String(msg) })
      },
    })
  }

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => logout.mutate() },
    ])
  }

  const initials = (profile?.fullName ?? user?.fullName ?? user?.email ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        {editing ? (
          <View style={styles.editRow}>
            <View style={styles.nameInput}>
              <Input
                value={name}
                onChangeText={setName}
                placeholder="Full name"
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
            </View>
            <Button size="sm" onPress={handleSave} loading={updateProfile.isPending}>Save</Button>
            <Button size="sm" variant="secondary" onPress={() => setEditing(false)}>Cancel</Button>
          </View>
        ) : (
          <>
            <Text style={styles.name}>{profile?.fullName ?? user?.fullName ?? '—'}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <Pressable onPress={() => { setName(profile?.fullName ?? user?.fullName ?? ''); setEditing(true) }} style={styles.editBtn}>
              <Ionicons name="pencil-outline" size={14} color={colors.primary} />
              <Text style={styles.editBtnText}>Edit name</Text>
            </Pressable>
          </>
        )}
      </View>

      {/* Subscription status */}
      {subscription && (
        <View style={styles.subCard}>
          <View style={styles.subRow}>
            <Text style={styles.subLabel}>Subscription</Text>
            <Badge variant={subscription.grantsAccess ? 'success' : 'warning'}>
              {subscription.status}
            </Badge>
          </View>
          <Text style={styles.subPlan}>{subscription.planName}</Text>
          <Text style={styles.subExpiry}>
            Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
          </Text>
        </View>
      )}

      {/* Menu */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.menuGroup}>
          <MenuItem icon="card-outline" label="Subscription" onPress={() => router.push('/subscriptions')} />
          <MenuItem icon="lock-closed-outline" label="Change Password" onPress={() => router.push('/change-password')} />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.menuGroup}>
          <MenuItem icon="log-out-outline" label="Sign out" onPress={handleLogout} danger />
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxxl },
  avatarSection: { alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.white },
  name: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  email: { fontSize: fontSize.sm, color: colors.subtle },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  editBtnText: { fontSize: fontSize.sm, color: colors.primary },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, width: '100%' },
  nameInput: { flex: 1 },
  subCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: `${colors.primary}44`,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  subRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  subPlan: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  subExpiry: { fontSize: fontSize.xs, color: colors.subtle },
  section: { gap: spacing.sm },
  sectionLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.subtle, textTransform: 'uppercase', letterSpacing: 0.8 },
  menuGroup: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuLabel: { flex: 1, fontSize: fontSize.md, color: colors.text },
})
