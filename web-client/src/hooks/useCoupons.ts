import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { couponService } from '../services/coupon.service'

export const couponKeys = {
  all: ['coupons'] as const,
  list: (page: number) => [...couponKeys.all, page] as const,
}

export function useCoupons(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: couponKeys.list(page),
    queryFn: () => couponService.listCoupons(page, pageSize),
    placeholderData: (prev) => prev,
  })
}

export function useCreateCoupon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      code: string
      discount: number
      isPercentage: boolean
      expiresAt: string
      maxUses?: number
    }) => couponService.createCoupon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: couponKeys.all })
    },
  })
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (couponId: string) => couponService.deleteCoupon(couponId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: couponKeys.all })
    },
  })
}
