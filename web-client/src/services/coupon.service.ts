import { api } from '../lib/axios'

export interface CouponItem {
  couponId: string
  code: string
  discount: number
  isPercentage: boolean
  expiresAt: string
  maxUses: number | null
  usedCount: number
}

export interface CouponResponse {
  couponId: string
  code: string
  discount: number
  isPercentage: boolean
  expiresAt: string
  maxUses: number | null
}

export interface CouponValidationResponse {
  isValid: boolean
  discountAmount: number
  finalPrice: number
  message: string | null
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export const couponService = {
  async listCoupons(page = 1, pageSize = 20): Promise<PagedResult<CouponItem>> {
    const response = await api.get<PagedResult<CouponItem>>('/api/coupons', {
      params: { page, pageSize },
    })
    return response.data
  },

  async createCoupon(data: {
    code: string
    discount: number
    isPercentage: boolean
    expiresAt: string
    maxUses?: number
  }): Promise<CouponResponse> {
    const response = await api.post<CouponResponse>('/api/coupons', data)
    return response.data
  },

  async deleteCoupon(couponId: string): Promise<void> {
    await api.delete(`/api/coupons/${couponId}`)
  },

  async validateCoupon(code: string, coursePrice: number): Promise<CouponValidationResponse> {
    const response = await api.post<CouponValidationResponse>('/api/coupons/validate', {
      code,
      coursePrice,
    })
    return response.data
  },
}
