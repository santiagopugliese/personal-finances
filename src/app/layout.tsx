import { Metadata, Viewport } from 'next'
import './globals.css'
import HeaderClient from '@/components/HeaderClient'

export const metadata: Metadata = {
  title: 'Personal Finances',
  description: 'App de finanzas personales con Next.js + Supabase',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#000000', // ✅ acá sí
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-neutral-50 text-neutral-900">
        <header className="border-b bg-white">
          <HeaderClient />
        </header>
        <main className="mx-auto max-w-5xl p-4">{children}</main>
      </body>
    </html>
  )
}
