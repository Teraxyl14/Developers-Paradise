import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Providers } from "@/providers";
import { Compass, PlusCircle, Trophy, BarChart3, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { NavLink } from "@/components/NavLink";
import { UserMenu } from "@/components/UserMenu";
import { MobileNav } from "@/components/MobileNav";

import { auth } from "@/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Developers Paradise | Discover Validated Dev Problems",
  description: "Discover validated developer problems and build your next project.",
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
  },
  manifest: '/site.webmanifest',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const ADMIN_EMAILS = ['maruttewari12@gmail.com', 'myraanand06@gmail.com'];
  const isAdmin = session?.user?.email ? ADMIN_EMAILS.includes(session.user.email) : false;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-zinc-50 text-zinc-950 dark:bg-[#050507] dark:text-slate-50 antialiased min-h-screen flex flex-col selection:bg-indigo-500/20 selection:text-indigo-900 dark:selection:text-indigo-200 transition-colors duration-300`}>
        <Providers>
          <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-[#050507]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-[#050507]/60 transition-colors">
            <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-4 md:px-6">
              <div className="flex items-center gap-6">
                <Link href="/" className="flex items-center gap-2.5 group">
                  <div className="w-9 h-9 rounded-lg overflow-hidden shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all border border-zinc-200 dark:border-white/10 shrink-0 group-hover:scale-105">
                     <img src="/logo.png" alt="Developers Paradise Logo" className="w-full h-full object-cover" />
                  </div>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-0.5">
                  <NavLink href="/dashboard" icon="compass">Discover</NavLink>
                  <NavLink href="/trends" icon="chart">Trends</NavLink>
                  <NavLink href="/leaderboard" icon="trophy">Leaderboard</NavLink>
                  <NavLink href="/submit" icon="plus">Submit</NavLink>
                  {isAdmin && <NavLink href="/admin" icon="shield">Admin</NavLink>}
                </nav>
              </div>
              
              <div className="flex items-center gap-1.5">
                {session?.user && <NotificationBell />}
                <ThemeToggle />
                <UserMenu session={session} />
                <MobileNav isAdmin={isAdmin} isLoggedIn={!!session?.user} />
              </div>
            </div>
          </header>

          <div className="flex-1 w-full gradient-mesh pb-24">
            {children}
          </div>

          <footer className="border-t border-zinc-200/80 dark:border-white/[0.06] py-10 mt-auto bg-white/50 dark:bg-[#050507]">
            <div className="max-w-6xl mx-auto px-4 md:px-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-md overflow-hidden border border-zinc-200 dark:border-white/10">
                      <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <span className="font-bold text-zinc-900 dark:text-white">DevParadise</span>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs">
                    AI-powered developer problem discovery platform. Find validated problems, build what matters.
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">Platform</h4>
                  <div className="flex flex-col gap-2">
                    <Link href="/dashboard" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Discover Ideas</Link>
                    <Link href="/trends" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Market Trends</Link>
                    <Link href="/leaderboard" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Leaderboard</Link>
                    <Link href="/submit" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Submit Problem</Link>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">Connect</h4>
                  <div className="flex flex-col gap-2">
                    <Link href="https://maruttewari.onrender.com/" target="_blank" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Portfolio</Link>
                    <Link href="https://github.com/Teraxyl14" target="_blank" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">GitHub</Link>
                  </div>
                </div>
              </div>
              <div className="border-t border-zinc-200/80 dark:border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400 dark:text-zinc-500">
                <span>&copy; {new Date().getFullYear()} Developers Paradise. All rights reserved.</span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">Built with <span className="font-medium text-zinc-600 dark:text-zinc-400">Next.js</span> + <span className="font-medium text-zinc-600 dark:text-zinc-400">Gemini AI</span></span>
                </div>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
