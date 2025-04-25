import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { SetProvider } from './context/SetContext'
import { Providers } from './providers'
import { Navbar } from './components/Navbar'
import * as Tooltip from '@radix-ui/react-tooltip'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from "sonner"

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
}

export const metadata: Metadata = {
  title: 'Donkey Bridge - Thai Language Mnemonics',
  description: 'Learn Thai vocabulary effectively with mnemonics and spaced repetition',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Donkey Bridge'
  },
  formatDetection: {
    telephone: false
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Donkey Bridge" />
          <meta name="format-detection" content="telephone=no" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="theme-color" content="#ffffff" />
        </head>
        <body className={inter.className}>
          <Toaster richColors position="top-right" />
          <Tooltip.Provider>
          <Providers>
            <SetProvider>
              <Navbar />
              <main>
                {children}
              </main>
            </SetProvider>
          </Providers>
          </Tooltip.Provider>
        </body>
      </html>
    </ClerkProvider>
  )
} 