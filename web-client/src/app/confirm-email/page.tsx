'use client'
import { Suspense } from 'react'
import ConfirmEmailPage from '../../views/auth/ConfirmEmailPage'

export default function Page() {
  return (
    <Suspense>
      <ConfirmEmailPage />
    </Suspense>
  )
}
