"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X, Compass, BarChart3, Trophy, PlusCircle, User, Shield, LogIn } from "lucide-react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { signIn } from "next-auth/react"

export function MobileNav({ isAdmin, isLoggedIn }: { isAdmin: boolean, isLoggedIn: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const links = [
    { href: "/dashboard", label: "Discover", icon: Compass },
    { href: "/trends", label: "Trends", icon: BarChart3 },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/submit", label: "Submit", icon: PlusCircle },
    ...(isLoggedIn ? [{ href: "/profile", label: "Profile", icon: User }] : []),
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ]

  // Close nav when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  const menuVariants = {
    closed: { opacity: 0, y: -20, scale: 0.95 },
    open: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 25, staggerChildren: 0.05, delayChildren: 0.1 } }
  }

  const itemVariants = {
    closed: { opacity: 0, x: -20 },
    open: { opacity: 1, x: 0 }
  }

  return (
    <div className="md:hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-50 flex items-center justify-center w-9 h-9 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface transition-all"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <Menu className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 z-40 bg-bg-primary/80 backdrop-blur-md" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div 
              variants={menuVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="absolute top-full left-4 right-4 z-50 liquid-glass border border-border-default rounded-2xl shadow-2xl p-3 space-y-1 mt-2"
            >
              {links.map(({ href, label, icon: Icon }) => (
                <motion.div key={href} variants={itemVariants}>
                  <Link
                    href={href}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${
                      pathname === href 
                        ? 'bg-accent-soft text-accent-text' 
                        : 'text-text-secondary hover:bg-bg-surface-hover'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </Link>
                </motion.div>
              ))}
              {!isLoggedIn && (
                <motion.div variants={itemVariants}>
                  <button
                    onClick={() => signIn('google')}
                    className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-sm font-bold text-white bg-accent hover:bg-accent-hover transition-all mt-2"
                  >
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </button>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
