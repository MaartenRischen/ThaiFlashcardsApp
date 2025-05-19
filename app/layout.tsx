import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { SetProvider } from './context/SetContext'
import Navbar from './components/Navbar'
import * as Tooltip from '@radix-ui/react-tooltip'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from "sonner"
import { initializeApp } from './lib/init'
import { FeedbackFooterClient } from "./components/FeedbackFooterClient";
import { FeedbackProvider } from "./context/FeedbackContext";

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

// Initialize the app
initializeApp().catch(console.error);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}
      signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL}
      afterSignInUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL}
      afterSignUpUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL}
    >
      <html lang="en">
        <head>
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Donkey Bridge" />
          <meta name="format-detection" content="telephone=no" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="theme-color" content="#ffffff" />
          
          {/* Favicon tags - Next.js handles favicon.ico and apple-touch-icon.png automatically when placed in /app */}
          {/* <link rel="shortcut icon" href="/favicon.ico" /> */}
          {/* <link rel="icon" href="/favicon.ico" type="image/x-icon" /> */}
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          {/* <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" /> */}
          <link rel="manifest" href="/manifest.json" />
          <meta name="msapplication-TileColor" content="#ffffff" />
          <meta name="msapplication-config" content="/browserconfig.xml" />
          <meta name="theme-color" content="#ffffff" />
        </head>
        <body className={inter.className}>
          <Toaster richColors position="top-left" duration={5000} />
          <Tooltip.Provider>
            <SetProvider>
              <FeedbackProvider>
                <Navbar />
                <main className="main-content min-h-screen relative">
                  {children}
                </main>
                <FeedbackFooterClient />
                {/* Copyright Notice */}
                <div className="w-full text-center text-xs text-gray-600 py-3 bg-[#181818]">
                  Copyright (c) 2025 Maarten Rischen. All rights reserved.
                </div>
              </FeedbackProvider>
            </SetProvider>
          </Tooltip.Provider>
        </body>
      </html>
    </ClerkProvider>
  )
} 