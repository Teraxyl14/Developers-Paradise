import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono, Bebas_Neue } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Providers } from "@/providers";
import { NotificationBell } from "@/components/NotificationBell";
import { NavLink } from "@/components/NavLink";
import { UserMenu } from "@/components/UserMenu";
import { MobileNav } from "@/components/MobileNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MainAppWrapper } from "@/components/MainAppWrapper";
import { LayoutChrome } from "@/components/LayoutChrome";
import { auth } from "@/auth";
import Image from "next/image";
import { Suspense } from "react";
import { CurrentYear } from "@/components/CurrentYear";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });

export const metadata: Metadata = {
  title: "Developer's Paradise | Discover Validated Dev Problems",
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
  verification: {
    google: "peghQYHF0xrKjxHWqvCJKet2t_pIFq1sxO1kF1-xZsg",
  },
};

function HeaderFallback() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-default bg-bg-primary/80 backdrop-blur-xl transition-colors">
      <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-border-default shrink-0">
              <Image src="/logo.png" alt="Developer's Paradise Logo" fill sizes="36px" className="object-cover" priority />
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-0.5">
            <Link href="/dashboard" className="px-3 py-1.5 rounded-lg text-sm font-medium text-text-muted hover:text-text-primary hover:bg-bg-surface transition-colors">Discover</Link>
            <Link href="/trends" className="px-3 py-1.5 rounded-lg text-sm font-medium text-text-muted hover:text-text-primary hover:bg-bg-surface transition-colors">Trends</Link>
            <Link href="/leaderboard" className="px-3 py-1.5 rounded-lg text-sm font-medium text-text-muted hover:text-text-primary hover:bg-bg-surface transition-colors">Leaderboard</Link>
            <Link href="/submit" className="px-3 py-1.5 rounded-lg text-sm font-medium text-text-muted hover:text-text-primary hover:bg-bg-surface transition-colors">Submit</Link>
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <div className="w-8 h-8 rounded-full bg-border-default/20 animate-pulse" />
        </div>
      </div>
    </header>
  );
}

async function HeaderComponent() {
  const session = await auth();
  const ADMIN_EMAILS = ['maruttewari12@gmail.com', 'myraanand06@gmail.com'];
  const isAdmin = session?.user?.email ? ADMIN_EMAILS.includes(session.user.email) : false;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-default bg-bg-primary/80 backdrop-blur-xl transition-colors">
      <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 rounded-lg overflow-hidden shadow-lg shadow-accent/15 group-hover:shadow-accent/30 transition-all border border-border-default shrink-0 group-hover:scale-105">
              <Image src="/logo.png" alt="Developer's Paradise Logo" fill sizes="36px" className="object-cover" priority />
            </div>
          </a>

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
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} ${bebasNeue.variable} font-sans bg-bg-primary text-text-primary antialiased min-h-screen flex flex-col transition-colors duration-300 overflow-x-hidden`}>
        <Providers>
          <MainAppWrapper>
            {/* Header — hidden on landing page via LayoutChrome */}
            <Suspense fallback={<HeaderFallback />}>
              <LayoutChrome>
                <HeaderComponent />
              </LayoutChrome>
            </Suspense>

            <div className="flex-1 w-full">
              {children}
            </div>

            {/* Footer — hidden on landing page via LayoutChrome */}
            <Suspense fallback={<div className="min-h-[100px] border-t border-border-default bg-bg-primary animate-pulse" />}>
              <LayoutChrome>
                <footer className="border-t border-border-default py-10 mt-auto bg-bg-primary transition-colors">
                  <div className="max-w-6xl mx-auto px-4 md:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="relative w-6 h-6 rounded-md overflow-hidden border border-border-default">
                            <Image src="/logo.png" alt="Logo" fill sizes="24px" className="object-cover" />
                          </div>
                          <span className="font-bold text-text-primary font-display">Developer&apos;s Paradise</span>
                        </div>
                        <p className="text-sm text-text-muted leading-relaxed max-w-xs">
                          AI-powered developer problem discovery platform. Find validated problems, build what matters.
                        </p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Platform</h4>
                        <div className="flex flex-col gap-2">
                          <Link href="/dashboard" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Discover Ideas</Link>
                          <Link href="/trends" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Market Trends</Link>
                          <Link href="/leaderboard" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Leaderboard</Link>
                          <Link href="/submit" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Submit Problem</Link>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Connect</h4>
                        <div className="flex flex-col gap-2">
                          <Link href="https://maruttewari.onrender.com/" target="_blank" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Portfolio</Link>
                          <Link href="https://github.com/Teraxyl14" target="_blank" className="text-sm text-text-secondary hover:text-text-primary transition-colors">GitHub</Link>
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-border-default pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
                      <span>&copy; <CurrentYear /> Developer&apos;s Paradise. All rights reserved.</span>
                      <span className="flex items-center gap-1.5">Built with <span className="font-medium text-text-secondary">Next.js</span> + <span className="font-medium text-text-secondary">Gemini AI</span></span>
                    </div>
                  </div>
                </footer>
              </LayoutChrome>
            </Suspense>
          </MainAppWrapper>
        </Providers>
      </body>
    </html>
  );
}
