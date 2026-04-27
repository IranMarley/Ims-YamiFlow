import React from 'react'
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native'
import { router } from 'expo-router'
import Toast from 'react-native-toast-message'
import { usePlans, useSubscription, useSubscribe, useCancelSubscription, useResumeSubscription } from '../hooks/useSubscription'
import { useAuthStore } from '../store/authStore'
import Spinner from '../components/ui/Spinner'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import ScreenHeader from '../components/ui/ScreenHeader'
import { colors, fontSize, fontWeight, spacing, radius } from '../lib/theme'
import type { SubscriptionPlan } from '../types/subscription'

function PlanCard({ plan, onSubscribe, loading }: { plan: SubscriptionPlan; onSubscribe: () => void; loading: boolean }) {
  const price = (plan.amount / 100).toFixed(2)
  return (
    <View style={styles.planCard}>
      <View style={styles.planHeader}>
        <Text style={styles.planName}>{plan.name}</Text>
        <View style={styles.planPriceRow}>
          <Text style={styles.planPrice}>${price}</Text>
          <Text style={styles.planInterval}>/{plan.interval}</Text>
        </View>
        {plan.trialDays && plan.trialDays > 0 ? (
          <Badge variant="success">{plan.trialDays}-day free trial</Badge>
        ) : null}
      </View>
      {plan.description && (
        <Text style={styles.planDesc}>{plan.description}</Text>
      )}
      <Button onPress={onSubscribe} loading={loading} fullWidth>Subscribe</Button>
    </View>
  )
}

export default function SubscriptionsScreen() {
  const user = useAuthStore((s) => s.user)
  const { data: plans, isLoading: plansLoading } = usePlans()
  const { data: subscription, isLoading: subLoading } = useSubscription()
  const subscribe = useSubscribe()
  const cancel = useCancelSubscription()
  const resume = useResumeSubscription()

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerText}>Sign in to manage your subscription.</Text>
        <Button onPress={() => router.push('/(auth)/login')}>Sign In</Button>
      </View>
    )
  }

  if (plansLoading || subLoading) return <Spinner fullScreen />

  const handleSubscribe = (planId: string) => {
    subscribe.mutate(planId, {
      onSuccess: (data) => {
        if (!data.clientSecret || !data.publishableKey) {
          Toast.show({ type: 'success', text1: 'Subscribed!', text2: 'You now have access to all courses.' })
        } else {
          Toast.show({ type: 'info', text1: 'Payment required', text2: 'Complete payment to activate.' })
        }
      },
    })
  }

  const handleCancel = () => {
    Alert.alert(
      'Cancel subscription',
      'Your access will continue until the end of the current period.',
      [
        { text: 'Keep subscription', style: 'cancel' },
        {
          text: 'Cancel', style: 'destructive',
          onPress: () => cancel.mutate(undefined, {
            onSuccess: () => Toast.show({ type: 'success', text1: 'Subscription cancelled' }),
          }),
        },
      ],
    )
  }

  const handleResume = () => {
    resume.mutate(undefined, {
      onSuccess: () => Toast.show({ type: 'success', text1: 'Subscription resumed!' }),
    })
  }

  const statusBadge: Record<string, 'success' | 'warning' | 'danger'> = {
    Active: 'success',
    Trialing: 'success',
    PastDue: 'danger',
    Cancelled: 'warning',
    Expired: 'danger',
  }

  return (
    <View style={styles.bg}>
    <ScreenHeader title="Subscription" />
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Current subscription */}
      {subscription ? (
        <View style={styles.currentSub}>
          <View style={styles.currentSubHeader}>
            <Text style={styles.currentSubTitle}>Current Subscription</Text>
            <Badge variant={statusBadge[subscription.status] ?? 'default'}>{subscription.status}</Badge>
          </View>
          <Text style={styles.planNameBig}>{subscription.planName}</Text>
          <Text style={styles.billingInfo}>
            ${(subscription.amount / 100).toFixed(2)}/{subscription.interval} · renews{' '}
            {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
          </Text>
          {subscription.cancelAtPeriodEnd && (
            <Text style={styles.cancelNote}>Cancels at period end</Text>
          )}

          <View style={styles.subActions}>
            {subscription.cancelAtPeriodEnd ? (
              <Button onPress={handleResume} loading={resume.isPending}>Resume Subscription</Button>
            ) : (
              <Button variant="danger" onPress={handleCancel} loading={cancel.isPending}>Cancel Subscription</Button>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.noSubBanner}>
          <Text style={styles.noSubTitle}>No active subscription</Text>
          <Text style={styles.noSubSub}>Choose a plan below to unlock all courses.</Text>
        </View>
      )}

      {/* Plans */}
      {!subscription?.grantsAccess && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Plans</Text>
          {(plans ?? []).map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onSubscribe={() => handleSubscribe(plan.id)}
              loading={subscribe.isPending}
            />
          ))}
        </View>
      )}
    </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, backgroundColor: colors.background },
  centerText: { fontSize: fontSize.md, color: colors.subtle, textAlign: 'center' },
  currentSub: {
    backgroundColor: `${colors.primary}11`,
    borderWidth: 1,
    borderColor: `${colors.primary}44`,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  currentSubHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  currentSubTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.subtle },
  planNameBig: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  billingInfo: { fontSize: fontSize.sm, color: colors.subtle },
  cancelNote: { fontSize: fontSize.xs, color: colors.warning, fontWeight: fontWeight.medium },
  subActions: { marginTop: spacing.sm },
  noSubBanner: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  noSubTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  noSubSub: { fontSize: fontSize.sm, color: colors.subtle },
  section: { gap: spacing.md },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  planHeader: { gap: spacing.xs },
  planName: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  planPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  planPrice: { fontSize: fontSize.xxxl, fontWeight: fontWeight.bold, color: colors.primary },
  planInterval: { fontSize: fontSize.sm, color: colors.subtle },
  planDesc: { fontSize: fontSize.sm, color: colors.subtle, lineHeight: 20 },
})
