import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Providers } from "@/providers";
import { Search, Compass, PlusCircle, UserCircle, Trophy, BarChart3, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

import { auth } from "@/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Developers Paradise | Discover Validated Dev Problems",
  description: "Find validated software developer pain points to build your next project.",
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
  const isAdmin = session?.user?.email === process.env.ADMIN_EMAIL;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-slate-50 antialiased min-h-screen flex flex-col selection:bg-blue-500/30 selection:text-blue-900 dark:selection:text-blue-200 transition-colors duration-300`}>
        <Providers>
          <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-white/10 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-zinc-950/60 transition-colors">
            <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-4">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-lg overflow-hidden shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all border border-zinc-200 dark:border-white/10 shrink-0">
                   <img src="/logo.png" alt="Developers Paradise Logo" className="w-full h-full object-cover" />
                </div>
                <span className="font-bold text-lg tracking-tight text-zinc-950 dark:text-white hidden sm:block">
                  Developers<span className="text-zinc-500 font-medium">Paradise</span>
                </span>
              </Link>
              
              <nav className="flex items-center space-x-1 sm:space-x-2">
                <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors">
                  <Compass className="w-4 h-4" />
                  <span className="hidden sm:inline">Discover</span>
                </Link>
                <Link href="/trends" className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Trends</span>
                </Link>
                <Link href="/leaderboard" className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors">
                  <Trophy className="w-4 h-4" />
                  <span className="hidden sm:inline">Leaderboard</span>
                </Link>
                <Link href="/submit" className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors">
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Submit</span>
                </Link>
                <Link href="/profile" className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors">
                  <UserCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
                    <Shield className="w-4 h-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}
                <div className="w-px h-4 bg-zinc-300 dark:bg-white/10 mx-2" />
                <ThemeToggle />
              </nav>
            </div>
          </header>

          <div className="flex-1 w-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.05),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pb-24">
            {children}
          </div>

          <footer className="border-t border-zinc-200 dark:border-white/5 py-8 mt-auto bg-zinc-50 dark:bg-zinc-950">
            <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-900 dark:text-white">Developers Paradise</span>
                <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
              </div>
              <div className="flex items-center gap-6 font-medium">
                <Link href="https://maruttewari.onrender.com/" target="_blank" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Portfolio</Link>
                <Link href="https://github.com/Teraxyl14" target="_blank" className="hover:text-zinc-900 dark:hover:text-white transition-colors">GitHub</Link>
                <Link href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Terms of Service</Link>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
