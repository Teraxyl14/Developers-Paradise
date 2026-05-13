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
    router.push(window.location.pathname + window.location.search) // remove hash
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
            
            <button
              onClick={() => signIn('github')}
              className="w-full mt-3 flex items-center justify-center gap-3 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-white font-semibold py-3.5 px-4 rounded-xl transition-transform hover:scale-[0.98] active:scale-95 shadow-lg"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              Continue with GitHub
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
