"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Compass, PlusCircle, Trophy, BarChart3, Shield } from "lucide-react"

const icons = {
  compass: Compass,
  plus: PlusCircle,
  trophy: Trophy,
  chart: BarChart3,
  shield: Shield,
}

export function NavLink({ href, icon, children }: { href: string, icon: keyof typeof icons, children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')
  const Icon = icons[icon]

  return (
    <Link 
      href={href} 
      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
        isActive 
          ? 'text-accent-text' 
          : 'text-text-muted hover:text-text-primary hover:bg-bg-surface'
      }`}
    >
      <Icon className={`w-4 h-4 ${isActive ? 'text-accent' : ''}`} />
      <span>{children}</span>
      {isActive && (
        <motion.div 
          layoutId="nav-active-indicator"
          className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-8 h-0.5 bg-accent rounded-full"
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />
      )}
    </Link>
  )
}
