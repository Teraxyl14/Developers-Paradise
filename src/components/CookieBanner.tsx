"use client"
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Cookie, X } from 'lucide-react'

const CONSENT_KEY = 'dp-cookie-consent'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Only show if user hasn't made a choice yet
    const consent = localStorage.getItem(CONSENT_KEY)
    if (!consent) {
      // Small delay so it doesn't flash immediately on page load
      const timer = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted')
    setVisible(false)
  }

  const handleReject = () => {
    localStorage.setItem(CONSENT_KEY, 'rejected')
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 inset-x-0 z-[998] p-4 md:p-6 pointer-events-none"
        >
          <div className="max-w-2xl mx-auto pointer-events-auto">
            <div className="relative bg-bg-primary/95 backdrop-blur-xl border border-border-default rounded-2xl shadow-2xl shadow-black/20 p-5 md:p-6">
              {/* Dismiss X */}
              <button
                onClick={handleReject}
                className="absolute top-3 right-3 p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-bg-surface transition-colors"
                aria-label="Dismiss cookie banner"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="hidden sm:flex shrink-0 w-10 h-10 rounded-xl bg-accent-soft items-center justify-center">
                  <Cookie className="w-5 h-5 text-accent" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-secondary leading-relaxed mb-1">
                    We use essential cookies for authentication and theme preferences. No third-party tracking cookies
                    are used.{' '}
                    <Link href="/legal/privacy" className="text-accent hover:underline font-medium">
                      Privacy Policy
                    </Link>{' '}
                    &middot;{' '}
                    <Link href="/legal/terms" className="text-accent hover:underline font-medium">
                      Terms
                    </Link>
                  </p>

                  {/* Buttons */}
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={handleAccept}
                      className="px-5 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-xl transition-all hover:scale-[0.98] active:scale-95 shadow-sm shadow-accent/20"
                    >
                      Accept
                    </button>
                    <button
                      onClick={handleReject}
                      className="px-5 py-2 bg-bg-surface hover:bg-bg-secondary border border-border-default text-text-secondary text-sm font-medium rounded-xl transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
