"use client"
import { usePathname } from "next/navigation"

export function LayoutChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLanding = pathname === "/"

  if (isLanding) return null
  return <>{children}</>
}
