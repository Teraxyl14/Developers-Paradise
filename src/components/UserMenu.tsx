"use client"
import { useState } from "react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { LogOut, User, Settings } from "lucide-react"

export function UserMenu({ session }: { session: any }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!session?.user) {
    return (
      <Link 
        href="/api/auth/signin"
        className="hidden md:flex items-center gap-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-all ml-1"
      >
        Sign In
      </Link>
    )
  }

  return (
    <div className="relative hidden md:block ml-1">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-all"
      >
        {session.user.image ? (
          <img src={session.user.image} alt="" className="w-7 h-7 rounded-full ring-2 ring-white dark:ring-zinc-800 shadow-sm" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-white dark:ring-zinc-800">
            {session.user.name?.charAt(0) || 'D'}
          </div>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 glass-card rounded-xl shadow-xl z-50 overflow-hidden border border-zinc-200/50 dark:border-white/10 py-1">
            <div className="px-4 py-3 border-b border-zinc-200/80 dark:border-white/[0.06]">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{session.user.name}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{session.user.email}</p>
            </div>
            <Link 
              href="/profile" 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-colors"
            >
              <User className="w-4 h-4 text-zinc-400" /> Profile
            </Link>
            <button 
              onClick={() => { setIsOpen(false); signOut(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
