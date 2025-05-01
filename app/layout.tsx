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
import { FeedbackModal } from "./components/FeedbackModal";
import { useState } from "react";

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
  // Feedback modal state
  const [isFeedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleFeedbackSubmit = async (feedback: string) => {
    setFeedbackStatus('idle');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });
      if (res.ok) {
        setFeedbackStatus('success');
        setTimeout(() => {
          setFeedbackOpen(false);
          setFeedbackStatus('idle');
        }, 1500);
      } else {
        setFeedbackStatus('error');
      }
    } catch (e) {
      setFeedbackStatus('error');
    }
  };
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
          <Toaster richColors position="top-left" />
          <Tooltip.Provider>
          <Providers>
            <SetProvider>
              <Navbar />
              <main className="main-content min-h-screen relative pb-24">
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
                {/* Persistent Beta Footer */}
                <div className="fixed bottom-0 left-0 w-full z-40 flex flex-col items-center justify-center bg-[#181818] border-t border-gray-700 py-3 px-2 shadow-lg">
                  <span className="text-xs md:text-sm text-gray-300 text-center mb-2 md:mb-0">
                    This is a <span className="bg-yellow-400 text-black rounded-full px-2 py-0.5 font-bold mx-1">Beta</span> version, 100% free to use. If you could take a minute to give us your unbridled feedback in return, we would massively appreciate that.
                  </span>
                  <button
                    onClick={() => setFeedbackOpen(true)}
                    className="mt-2 md:mt-0 px-4 py-1 rounded bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition text-xs md:text-sm shadow"
                  >
                    Give Feedback
                  </button>
                </div>
                <FeedbackModal
                  isOpen={isFeedbackOpen}
                  onClose={() => { setFeedbackOpen(false); setFeedbackStatus('idle'); }}
                  onSubmit={handleFeedbackSubmit}
                  status={feedbackStatus}
                />
              </main>
            </SetProvider>
          </Providers>
          </Tooltip.Provider>
        </body>
      </html>
    </ClerkProvider>
  )
} 