"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive 
          ? 'text-indigo-600 dark:text-indigo-400' 
          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
      }`}
    >
      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-500 dark:text-indigo-400' : ''}`} />
      <span>{children}</span>
      {isActive && (
        <span className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-6 h-0.5 bg-indigo-500 dark:bg-indigo-400 rounded-full" />
      )}
    </Link>
  )
}
