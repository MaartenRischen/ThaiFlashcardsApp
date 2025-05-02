import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { SetProvider } from './context/SetContext'
import { Providers } from './providers'
import { Navbar } from './components/Navbar'
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
    <ClerkProvider>
      <html lang="en">
        <head>
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Donkey Bridge" />
          <meta name="format-detection" content="telephone=no" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="theme-color" content="#ffffff" />
          
          {/* Favicon tags */}
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        </head>
        <body className={inter.className}>
          <Toaster richColors position="top-left" />
          <Tooltip.Provider>
          <Providers>
            <SetProvider>
              <FeedbackProvider>
                <Navbar />
                <main className="main-content min-h-screen relative">
                  {children}
                  {/* Temporary Dev Buttons */}
                  <div className="fixed bottom-4 left-4 flex gap-2 opacity-50 hover:opacity-100 transition-opacity">
                    <a 
                      href="/test-variations" 
                      className="px-3 py-1 bg-purple-900/50 hover:bg-purple-800/50 text-purple-200 text-xs rounded-full border border-purple-700/30"
                    >
                      Test Variations
                    </a>
                    <a 
                      href="/generation_logic_visualization.html" 
                      className="px-3 py-1 bg-blue-900/50 hover:bg-blue-800/50 text-blue-200 text-xs rounded-full border border-blue-700/30"
                    >
                      Logic Visualization
                    </a>
                  </div>
                </main>
                <FeedbackFooterClient />
              </FeedbackProvider>
            </SetProvider>
          </Providers>
          </Tooltip.Provider>
        </body>
      </html>
    </ClerkProvider>
  )
} 