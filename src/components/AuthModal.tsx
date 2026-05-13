"use client"
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { signIn } from 'next-auth/react'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AuthModal() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleHashChange = () => {
      setIsOpen(window.location.hash === '#login')
    }
    
    // Check initial
    handleHashChange()
    
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const close = () => {
    setIsOpen(false)
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="relative w-full max-w-md liquid-glass p-8 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-indigo to-crimson-danger" />
            
            <button 
              onClick={close}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto bg-black border border-white/10 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-cyber-indigo/20">
                <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
              </div>
              <h2 className="text-2xl font-bold font-display text-white mb-2">Welcome Back</h2>
              <p className="text-zinc-400 text-sm">Sign in to submit problems, upvote, and connect with other developers.</p>
            </div>

            <button
              onClick={() => signIn('google')}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-black font-semibold py-3.5 px-4 rounded-xl transition-transform hover:scale-[0.98] active:scale-95 shadow-lg"
            >
              <img src="https://authjs.dev/img/providers/google.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>


            <div className="mt-8 text-center text-xs text-zinc-500">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
