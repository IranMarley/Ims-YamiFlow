'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Header from '../../components/layout/Header'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { useCoupons, useCreateCoupon, useDeleteCoupon } from '../../hooks/useCoupons'

const schema = z.object({
  code: z.string().min(1, 'Code is required').max(50),
  discount: z.coerce.number().positive('Discount must be positive'),
  isPercentage: z.boolean(),
  expiresAt: z.string().min(1, 'Expiry date is required'),
  maxUses: z.coerce.number().int().positive().optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

export default function CouponsPage() {
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const pageSize = 20

  const { data, isLoading } = useCoupons(page, pageSize)
  const createMutation = useCreateCoupon()
  const deleteMutation = useDeleteCoupon()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isPercentage: true },
  })

  const onSubmit = (formData: FormData) => {
    createMutation.mutate(
      {
        code: formData.code,
        discount: formData.discount,
        isPercentage: formData.isPercentage,
        expiresAt: new Date(formData.expiresAt).toISOString(),
        maxUses: formData.maxUses ? Number(formData.maxUses) : undefined,
      },
      {
        onSuccess: () => {
          reset()
          setShowForm(false)
        },
      },
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text">Coupons</h1>
            <p className="text-subtle mt-1">Manage discount coupons for courses</p>
          </div>
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            Create coupon
          </Button>
        </div>

        {/* Create coupon form */}
        {showForm && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-text mb-4">New coupon</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4" noValidate>
              <Input
                label="Coupon code"
                placeholder="e.g. SUMMER20"
                registration={register('code')}
                error={errors.code?.message}
              />
              <Input
                label="Discount amount"
                type="number"
                placeholder="e.g. 20"
                registration={register('discount')}
                error={errors.discount?.message}
              />
              <Input
                label="Expires at"
                type="date"
                registration={register('expiresAt')}
                error={errors.expiresAt?.message}
              />
              <Input
                label="Max uses (optional)"
                type="number"
                placeholder="Leave blank for unlimited"
                registration={register('maxUses')}
                error={errors.maxUses?.message}
              />

              <div className="flex items-center gap-3 sm:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    suppressHydrationWarning
                    type="checkbox"
                    className="w-4 h-4 rounded"
                    {...register('isPercentage')}
                  />
                  <span className="text-sm text-text">Percentage discount</span>
                </label>
              </div>

              {createMutation.isError && (
                <div className="sm:col-span-2 rounded-xl bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
                  Failed to create coupon. Please try again.
                </div>
              )}

              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" loading={createMutation.isPending}>
                  Create
                </Button>
                <Button type="button" variant="secondary" onClick={() => { setShowForm(false); reset() }}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Coupons table */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : data?.items.length === 0 ? (
          <EmptyState
            title="No coupons yet"
            description="Create your first discount coupon."
            action={{ label: 'Create coupon', onClick: () => setShowForm(true) }}
          />
        ) : (
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-subtle font-medium">Code</th>
                  <th className="text-left px-5 py-3 text-subtle font-medium">Discount</th>
                  <th className="text-left px-5 py-3 text-subtle font-medium">Expires</th>
                  <th className="text-left px-5 py-3 text-subtle font-medium">Uses</th>
                  <th className="text-right px-5 py-3 text-subtle font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((coupon) => (
                  <tr
                    key={coupon.couponId}
                    className="border-b border-border/50 last:border-0 hover:bg-surface-hover/50 transition-colors"
                  >
                    <td className="px-5 py-3 font-mono font-medium text-text">{coupon.code}</td>
                    <td className="px-5 py-3 text-text">
                      {coupon.isPercentage ? `${coupon.discount}%` : `$${coupon.discount.toFixed(2)}`}
                    </td>
                    <td className="px-5 py-3 text-subtle">
                      {new Date(coupon.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-subtle">
                      {coupon.usedCount}{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        size="sm"
                        variant="danger"
                        loading={
                          deleteMutation.isPending &&
                          deleteMutation.variables === coupon.couponId
                        }
                        onClick={() => deleteMutation.mutate(coupon.couponId)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 px-5 py-4 border-t border-border">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-subtle">
                  Page {page} of {data.totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
