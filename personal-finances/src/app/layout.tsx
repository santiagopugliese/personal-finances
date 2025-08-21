import './globals.css'
import HeaderClient from '@/components/HeaderClient'

export const metadata = {
  title: 'Personal Finances',
  description: 'ARS/USD + dólar blue',
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
