"use client"
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { signIn, useSession } from 'next-auth/react'
import { X, Mail, Lock, User, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { registerUser } from '@/actions/auth'

export function AuthModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const { status } = useSession()

  useEffect(() => {
    if (status === 'authenticated') {
      setIsOpen(false)
      if (window.location.hash === '#login') {
        router.replace(window.location.pathname + window.location.search, { scroll: false })
      }
      return
    }

    const handleHashChange = () => {
      setIsOpen(window.location.hash === '#login')
    }
    
    // Check initial
    handleHashChange()
    
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [status, router])

  const close = () => {
    setIsOpen(false)
    router.replace(window.location.pathname + window.location.search, { scroll: false })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    try {
      if (mode === 'signup') {
        const result = await registerUser(formData)
        if (result?.error) {
          setError(result.error)
          setLoading(false)
          return
        }
        // If registration is successful, sign them in automatically
      }
      
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (res?.error) {
        setError("Invalid email or password")
      } else if (res?.ok) {
        close()
        router.refresh()
      }
    } catch (err) {
      setError("An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
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
            className="relative w-full max-w-md bg-zinc-950/80 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl overflow-hidden"
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
              <h2 className="text-2xl font-bold font-display text-white mb-2">
                {mode === 'signin' ? 'Welcome Back' : 'Create an Account'}
              </h2>
              <p className="text-zinc-400 text-sm">
                {mode === 'signin' 
                  ? 'Sign in to submit problems and upvote.' 
                  : 'Join the builder horizon. Innovate with us.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-xl mb-4 overflow-hidden"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative overflow-hidden"
                  >
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-zinc-500" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      placeholder="Full Name"
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-white/5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyber-indigo focus:border-cyber-indigo transition-all sm:text-sm"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-white/5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyber-indigo focus:border-cyber-indigo transition-all sm:text-sm"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-white/5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyber-indigo focus:border-cyber-indigo transition-all sm:text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-cyber-indigo hover:bg-cyber-indigo/90 text-white font-semibold py-3.5 px-4 rounded-xl transition-transform hover:scale-[0.98] active:scale-95 shadow-lg shadow-cyber-indigo/25 disabled:opacity-70 disabled:hover:scale-100 mt-2"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-zinc-950 text-zinc-500">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => signIn('google')}
                className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-3 px-4 rounded-xl transition-all"
              >
                <img src="https://authjs.dev/img/providers/google.svg" alt="Google" className="w-5 h-5" />
                Google
              </button>
              
              <button
                onClick={() => signIn('github')}
                className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-3 px-4 rounded-xl transition-all hover:text-white"
              >
                <img src="https://authjs.dev/img/providers/github.svg" alt="GitHub" className="w-5 h-5 invert" />
                GitHub
              </button>
            </div>

            <div className="text-center text-sm text-zinc-400">
              {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button"
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin')
                  setError(null)
                }}
                className="text-cyber-indigo hover:text-cyber-indigo/80 font-medium transition-colors"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
