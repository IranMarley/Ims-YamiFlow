import React from 'react'
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { usePlans } from '../hooks/useSubscription'
import { useAuthStore } from '../store/authStore'
import Spinner from '../components/ui/Spinner'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import ScreenHeader from '../components/ui/ScreenHeader'
import { colors, fontSize, fontWeight, spacing, radius } from '../lib/theme'

const FEATURES = [
  'Unlimited course access',
  'HD video lessons',
  'Completion certificates',
  'New courses every month',
  'Cancel anytime',
]

export default function PricingScreen() {
  const { data: plans, isLoading } = usePlans()
  const user = useAuthStore((s) => s.user)

  const handleCTA = () => {
    if (user) {
      router.push('/subscriptions')
    } else {
      router.push('/(auth)/login')
    }
  }

  if (isLoading) return <Spinner fullScreen />

  return (
    <View style={styles.bg}>
    <ScreenHeader title="Pricing" />
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTag}>Simple pricing</Text>
        <Text style={styles.heroTitle}>Unlock everything</Text>
        <Text style={styles.heroSub}>
          One subscription. All courses. Cancel anytime.
        </Text>
      </View>

      {/* Plans */}
      {(plans ?? []).map((plan) => {
        const price = (plan.amount / 100).toFixed(2)
        const isAnnual = plan.interval === 'year'
        return (
          <View key={plan.id} style={[styles.planCard, isAnnual && styles.planCardFeatured]}>
            {isAnnual && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>Most Popular</Text>
              </View>
            )}
            <Text style={styles.planName}>{plan.name}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>${price}</Text>
              <Text style={styles.interval}>/{plan.interval}</Text>
            </View>
            {plan.trialDays && plan.trialDays > 0 ? (
              <Badge variant="success">{plan.trialDays}-day free trial</Badge>
            ) : null}
            {plan.description && <Text style={styles.planDesc}>{plan.description}</Text>}
            <Button
              onPress={handleCTA}
              variant={isAnnual ? 'primary' : 'secondary'}
              fullWidth
            >
              {user ? 'Subscribe' : 'Get started'}
            </Button>
          </View>
        )
      })}

      {/* Features */}
      <View style={styles.features}>
        <Text style={styles.featuresTitle}>Everything included</Text>
        {FEATURES.map((f) => (
          <View key={f} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>

      {/* Free courses */}
      <Pressable style={styles.freeNote} onPress={() => router.push('/(tabs)/courses/')}>
        <Text style={styles.freeNoteText}>Just browsing? Free courses available — no account needed.</Text>
        <Ionicons name="arrow-forward" size={16} color={colors.primary} />
      </Pressable>
    </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxxl },
  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  heroTag: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: { fontSize: fontSize.xxxl, fontWeight: fontWeight.bold, color: colors.text, textAlign: 'center' },
  heroSub: { fontSize: fontSize.md, color: colors.subtle, textAlign: 'center', lineHeight: 24 },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
  },
  planCardFeatured: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}0A`,
  },
  popularBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  popularText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.white },
  planName: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  price: { fontSize: 40, fontWeight: fontWeight.bold, color: colors.primary },
  interval: { fontSize: fontSize.sm, color: colors.subtle },
  planDesc: { fontSize: fontSize.sm, color: colors.subtle, lineHeight: 20 },
  features: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
  },
  featuresTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  featureText: { fontSize: fontSize.md, color: colors.text },
  freeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${colors.primary}11`,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
  },
  freeNoteText: { flex: 1, fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
})
