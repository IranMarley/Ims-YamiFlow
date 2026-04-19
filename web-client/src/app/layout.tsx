import type { Metadata } from 'next'
import '../styles/globals.css'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'YamiFlow — Learn Without Limits',
  description: 'Unlimited access to all courses with a single subscription.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
