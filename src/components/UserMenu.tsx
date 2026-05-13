"use client"
import { useState } from "react"
import { signOut, signIn } from "next-auth/react"
import Link from "next/link"
import { LogOut, User } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function UserMenu({ session }: { session: any }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!session?.user) {
    return (
      <button 
        onClick={() => signIn('google')}
        className="hidden md:flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text-primary px-3 py-1.5 rounded-lg hover:bg-bg-surface transition-all ml-1"
      >
        Sign In
      </button>
    )
  }

  return (
    <div className="relative hidden md:block ml-1">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-bg-surface transition-all"
      >
        {session.user.image ? (
          <img src={session.user.image} alt="" className="w-7 h-7 rounded-full ring-2 ring-bg-primary shadow-sm" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-bg-primary">
            {session.user.name?.charAt(0) || 'D'}
          </div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="absolute right-0 mt-2 w-56 liquid-glass rounded-xl shadow-xl z-50 overflow-hidden py-1"
            >
              <div className="px-4 py-3 border-b border-border-default">
                <p className="text-sm font-semibold text-text-primary truncate">{session.user.name}</p>
                <p className="text-xs text-text-muted truncate">{session.user.email}</p>
              </div>
              <Link 
                href="/profile" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:bg-bg-surface transition-colors"
              >
                <User className="w-4 h-4 text-text-muted" /> Profile
              </Link>
              <button 
                onClick={() => { setIsOpen(false); signOut({ callbackUrl: '/' }); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-danger-soft transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
