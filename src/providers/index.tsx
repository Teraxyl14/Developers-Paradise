"use client"
import { SessionProvider } from "next-auth/react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import dynamic from "next/dynamic"

const AuthModal = dynamic(() => import("@/components/AuthModal").then(mod => mod.AuthModal), { ssr: false })
const CommandPalette = dynamic(() => import("@/components/CommandPalette").then(mod => mod.CommandPalette), { ssr: false })

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SessionProvider>
        <CommandPalette />
        <AuthModal />
        {children}
      </SessionProvider>
    </NextThemesProvider>
  )
}
