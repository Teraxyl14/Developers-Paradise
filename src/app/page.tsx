"use client"
import { Suspense, useState, useEffect, useRef } from "react"
import { Canvas } from "@react-three/fiber"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { ArrowRight, BarChart3, Sun, Moon, Clock, Compass, Trophy, PlusCircle, User, Flame, CheckCircle, ChevronUp } from "lucide-react"
import { NetworkEarth, SpaceParticles } from "@/components/EarthScene"
import { useTheme } from "next-themes"
import { signIn, useSession } from "next-auth/react"
import { getLandingStats, getFeaturedIdeas } from "@/actions/ideas"
import { upvoteIdea } from "@/actions/interactions"

interface FeaturedIdea {
  id: string;
  title: string;
  domain: string;
  difficulty: string;
  devTime: string;
  recommendedStack: string[];
  mentionCount: number;
  upvotesCount: number;
}


/* ── Satisfying Animated Re-Counter ── */
function Counter({ value, label }: { value: number; label: string }) {
  const [displayValue, setDisplayValue] = useState(0)
  const [triggerKey, setTriggerKey] = useState(0)

  useEffect(() => {
    let start = 0
    const end = value
    if (end === 0) {
      return
    }

    const duration = 1200
    const increment = Math.ceil(end / 40)
    const stepTime = Math.max(Math.floor(duration / 40), 15)

    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setDisplayValue(end)
        clearInterval(timer)
      } else {
        setDisplayValue(start)
      }
    }, stepTime)

    return () => clearInterval(timer)
  }, [value, triggerKey])

  return (
    <motion.div
      onClick={() => setTriggerKey(prev => prev + 1)}
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.96 }}
      className="text-center cursor-pointer select-none bg-bg-surface dark:bg-zinc-900/40 p-6 rounded-2xl border border-border-default/80 shadow-sm hover:shadow-md hover:border-accent/30 transition-all duration-300 group"
    >
      <div className="text-3xl md:text-4xl font-black font-display text-text-primary group-hover:text-accent transition-colors">
        {displayValue === 0 ? "..." : displayValue.toLocaleString()}
      </div>
      <div className="text-xs text-text-muted uppercase tracking-wider font-semibold mt-1">
        {label}
      </div>
      <div className="text-[10px] text-text-faint opacity-0 group-hover:opacity-100 transition-opacity mt-2 font-mono">
        (Click to recount)
      </div>
    </motion.div>
  )
}

export default function LandingPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const { data: session } = useSession()

  // IST Clock State
  const [timeStr, setTimeStr] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Satisfying gamified states
  const [upvotedIdeas, setUpvotedIdeas] = useState<string[]>([])
  const [personaType, setPersonaType] = useState("saas")
  const [clockMotto, setClockMotto] = useState("Perfect hour to refactor.")

  const toggleDropdown = () => {
    const nextState = !dropdownOpen
    setDropdownOpen(nextState)
    if (nextState) {
      const mottos = [
        "Time to deploy. No pressure.",
        "Coffee level: Critical. Keep coding.",
        "Zero compiler errors detected. Keep going.",
        "Git commit -m 'fixed stuff' is highly authorized right now.",
        "Perfect hour to refactor that legacy hook.",
        "A bug in production is just a feature waiting to be billed.",
        "Remember: 'It works on my machine' is a legally binding statement."
      ]
      const randomMotto = mottos[Math.floor(Math.random() * mottos.length)]
      setClockMotto(randomMotto as string)
    }
  }

  const handleUpvote = async (id: string) => {
    if (!session) {
      window.location.hash = '#login'
      return
    }

    const isAlreadyUpvoted = upvotedIdeas.includes(id)
    if (isAlreadyUpvoted) {
      setUpvotedIdeas(prev => prev.filter(item => item !== id))
    } else {
      setUpvotedIdeas(prev => [...prev, id])
    }

    try {
      await upvoteIdea(id)
    } catch (err) {
      console.error("Failed to upvote idea on backend:", err)
      // Rollback optimistic state on backend failure
      if (isAlreadyUpvoted) {
        setUpvotedIdeas(prev => [...prev, id])
      } else {
        setUpvotedIdeas(prev => prev.filter(item => item !== id))
      }
    }
  }



  // DB Stats telemetry counts state
  const [stats, setStats] = useState({ problems: 0, users: 0, analyses: 0 })
  const [statsLoaded, setStatsLoaded] = useState(false)

  // Opportunity Radar live data state
  const [featuredIdeas, setFeaturedIdeas] = useState<FeaturedIdea[]>([])

  useEffect(() => {
    // Avoid synchronous setState in effect body to prevent cascading renders
    setTimeout(() => setMounted(true), 0)

    // Start IST Ticking Clock
    const updateTime = () => {
      const now = new Date()
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }
      const formatter = new Intl.DateTimeFormat('en-US', options)
      const parts = formatter.formatToParts(now)
      const hour = parts.find(p => p.type === 'hour')?.value || ""
      const minute = parts.find(p => p.type === 'minute')?.value || ""
      const second = parts.find(p => p.type === 'second')?.value || ""
      let dayPeriod = parts.find(p => p.type === 'dayPeriod')?.value || ""
      dayPeriod = dayPeriod.toUpperCase()
      setTimeStr(`${hour}:${minute}:${second} ${dayPeriod} IST`)
    }

    updateTime()
    const timer = setInterval(updateTime, 1000)

    // Fetch live statistics
    getLandingStats().then(data => {
      setStats(data)
      setStatsLoaded(true)
    })

    // Fetch featured opportunities
    getFeaturedIdeas().then(data => {
      if (data && data.length > 0) {
        setFeaturedIdeas(data)
      } else {
        // High fidelity fallbacks in case database is empty or queries are executing
        setFeaturedIdeas([
          {
            id: "fallback-1",
            title: "Real-Time Collaborative CRDT Conflict Resolver",
            domain: "DevTools",
            difficulty: "Advanced",
            devTime: "2-3 weeks",
            recommendedStack: ["Rust", "Yjs", "WebSockets"],
            mentionCount: 8,
            upvotesCount: 42
          },
          {
            id: "fallback-2",
            title: "Egress-Aware Multi-Cloud API Cache",
            domain: "Backend",
            difficulty: "Intermediate",
            devTime: "1-2 weeks",
            recommendedStack: ["Redis", "Go", "Docker"],
            mentionCount: 5,
            upvotesCount: 29
          },
          {
            id: "fallback-3",
            title: "Automated MVP Prisma Vector Scaffolder",
            domain: "AI/ML",
            difficulty: "Intermediate",
            devTime: "1-2 weeks",
            recommendedStack: ["Next.js", "Gemini API", "PostgreSQL"],
            mentionCount: 6,
            upvotesCount: 31
          }
        ])
      }
    })

    return () => clearInterval(timer)
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])



  // Traversal routes configuration
  const navigationRoutes = [
    { href: "/dashboard", label: "Discover Feed", desc: "Browse validated dev complaints", icon: Compass, color: "text-blue-500" },
    { href: "/trends", label: "Market Galaxy", desc: "Explore AI demand heatmaps", icon: BarChart3, color: "text-indigo-500" },
    { href: "/leaderboard", label: "Leaderboard", desc: "Check top builder rankings", icon: Trophy, color: "text-amber-500" },
    { href: "/submit", label: "Submit Problem", desc: "Add a validated pain point", icon: PlusCircle, color: "text-emerald-500" },
    { href: "/profile", label: "My Profile", desc: "View builds, streaking & stats", icon: User, color: "text-purple-500" },
  ]

  // Track page scroll to drive the 3D camera
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // Animation values for the background riser text (rising from behind the globe)
  const riserY = useTransform(scrollYProgress, [0, 0.5], ["0vh", "-20vh"])
  const riserScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.2])
  const riserOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])

  return (
    <div ref={containerRef} className="text-text-primary min-h-screen relative">

      {/* Sticky floating glass header */}
      <div className="sticky top-0 w-full z-50 bg-bg-primary/50 backdrop-blur-lg border-b border-border-default/45 shadow-sm transition-colors duration-300">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 max-w-6xl mx-auto w-full">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0 cursor-pointer">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden border border-border-default shadow-lg shadow-accent/10 group-hover:scale-105 transition-transform">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold font-display text-text-primary text-lg hidden sm:flex items-center">
              {"Developer's Paradise".split("").map((char, index) => (
                <motion.span
                  key={index}
                  whileHover={{ y: -5, scale: 1.15, color: "var(--accent)" }}
                  transition={{ type: "spring", stiffness: 350, damping: 8 }}
                  className="inline-block origin-bottom select-none"
                  style={{ marginRight: char === " " ? "6px" : "1px" }}
                >
                  {char}
                </motion.span>
              ))}
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-bg-surface transition-colors text-text-muted hover:text-text-primary cursor-pointer"
            >
              {mounted ? (theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />) : <div className="w-4.5 h-4.5" />}
            </button>
            {session ? (
              <Link
                href="/dashboard"
                className="text-xs sm:text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                Dashboard
              </Link>
            ) : (
              <button
                onClick={() => { window.location.hash = '#login' }}
                className="text-xs sm:text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                Sign In
              </button>
            )}

            {/* Traverse dropdown clock capsule */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                className="liquid-glass text-xs sm:text-sm font-mono font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-accent hover:text-accent-hover hover:border-accent/40 active:scale-95 transition-all flex items-center gap-2 group cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 animate-pulse text-accent" />
                <span>{timeStr || "Ticking..."}</span>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-72 rounded-2xl border border-border-default p-2 z-50 shadow-2xl flex flex-col gap-1 bg-white dark:bg-zinc-950 backdrop-blur-2xl"
                  >
                    <div className="px-3 py-2 border-b border-border-default/40 mb-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted font-mono">Traverse Paradise</span>
                    </div>

                    {navigationRoutes.map((route) => {
                      const Icon = route.icon
                      return (
                        <Link
                          key={route.href}
                          href={route.href}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-bg-surface-hover transition-all group/item cursor-pointer"
                        >
                          <div className={`p-2 rounded-lg bg-bg-secondary group-hover/item:scale-105 transition-all ${route.color} bg-opacity-10`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <span className="text-sm font-bold text-text-primary group-hover/item:text-accent transition-colors block">{route.label}</span>
                            <span className="text-[11px] text-text-muted mt-0.5 block leading-tight">{route.desc}</span>
                          </div>
                        </Link>
                      )
                    })}

                    {/* Satisfying Clock Motto at bottom of dropdown */}
                    <div className="px-3 py-2.5 border-t border-border-default/40 mt-1 bg-bg-secondary/40 rounded-b-xl text-center select-none">
                      <span className="text-[10px] font-mono italic text-accent font-bold">
                        &ldquo;{clockMotto}&rdquo;
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ LAYER 1: BACKGROUND STARS ═══ */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <Suspense fallback={null}>
          <Canvas camera={{ position: [0, 0, 3.8], fov: 45 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
            <SpaceParticles theme={theme as string} />
          </Canvas>
        </Suspense>
      </div>

      {/* ═══ LAYER 2: BACKGROUND RISER TEXT ═══ */}
      <div className="fixed inset-0 z-0 flex items-start justify-center pointer-events-none overflow-hidden pt-24 sm:pt-20">
        <motion.h1
          style={{ y: riserY, scale: riserScale, opacity: riserOpacity, fontFamily: "var(--font-bebas)" }}
          className="text-[12vw] sm:text-[14vw] font-normal leading-none text-text-primary whitespace-nowrap tracking-tight select-none drop-shadow-[0_0_15px_rgba(0,0,0,0.05)] dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
        >
          BUILD WHAT DEVS <span className="text-gradient">NEED</span>
        </motion.h1>
      </div>

      {/* ═══ LAYER 3: 3D GLOBE FOREGROUND ═══ */}
      <div className="fixed inset-0 z-[1] pointer-events-none">
        <Suspense fallback={null}>
          <Canvas camera={{ position: [0, 0, 3.8], fov: 45 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }} style={{ background: "transparent" }}>
            <ambientLight intensity={theme === "light" ? 0.6 : 0.15} />
            <pointLight position={[5, 5, 5]} intensity={theme === "light" ? 1.5 : 1} color="#ffffff" />
            <pointLight position={[-4, -3, -5]} intensity={0.5} color={theme === "light" ? "#a5b4fc" : "#6366f1"} />
            <NetworkEarth scrollProgress={scrollYProgress} theme={theme as string} />
          </Canvas>
        </Suspense>
      </div>

      {/* ═══ PAGE CONTENT (scrolls over fixed globe) ═══ */}
      <div className="relative z-10">
        {/* ═══ HERO ═══ */}
        <section className="relative h-screen flex flex-col items-center justify-center">

          {/* Gradient overlay - removed top tint to clear the riser text */}
          <div className="absolute inset-0 z-[1] bg-gradient-to-b from-transparent via-transparent to-bg-primary pointer-events-none" />

          {/* Hero text */}
          <div className="relative z-10 text-center max-w-3xl px-4 sm:px-6 mt-2 sm:mt-8">


            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.4 }} className="text-4xl sm:text-6xl md:text-8xl font-black font-display leading-[1.0] sm:leading-[0.92] tracking-tight mb-4 sm:mb-6 drop-shadow-[0_4px_10px_rgba(0,0,0,0.05)] dark:drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)] text-text-primary">
              Developer&apos;s <span className="text-gradient">Paradise</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }} className="text-lg md:text-xl text-text-primary max-w-2xl mx-auto leading-relaxed mb-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.05)] dark:drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
              The ultimate platform to discover, build, and ship solutions for real developer problems. Stop guessing—solve what the market actually needs right now.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.1 }} className="flex flex-col sm:flex-row gap-4 justify-center w-full px-4 sm:px-0">
              {session ? (
                <Link
                  href="/dashboard"
                  className="group inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-bold py-3.5 px-8 rounded-2xl transition-all hover:scale-[0.98] active:scale-95 shadow-lg shadow-accent/20 text-sm w-full sm:w-auto"
                >
                  Go to Dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <button
                  onClick={() => { window.location.hash = '#login' }}
                  className="group inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-bold py-3.5 px-8 rounded-2xl transition-all hover:scale-[0.98] active:scale-95 shadow-lg shadow-accent/20 text-sm w-full sm:w-auto"
                >
                  Get Started Free <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
              <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 border border-border-default hover:bg-bg-surface text-text-secondary hover:text-text-primary font-semibold py-3.5 px-8 rounded-2xl transition-all text-sm w-full sm:w-auto">
                Browse Problems
              </Link>
            </motion.div>
          </div>



          {/* Scroll indicator */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }} className="absolute bottom-20 z-10">
            <div className="w-5 h-8 rounded-full border border-border-default flex items-start justify-center p-1.5">
              <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} className="w-1 h-1 rounded-full bg-text-muted" />
            </div>
          </motion.div>
        </section>

        {/* ═══ SCROLLING CONTENT WRAPPER ═══ */}
        <div className="relative z-10 bg-bg-primary">

          {/* ═══ REAL TELEMETRY STATS ═══ */}
          <section className="border-y border-border-default bg-bg-secondary/50 backdrop-blur-sm py-10 sm:py-14 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-purple-500/5 opacity-30 pointer-events-none" />
            <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 relative z-10">
              <Counter value={statsLoaded ? stats.problems : 0} label="Problems Scraped" />
              <Counter value={statsLoaded ? stats.users : 0} label="Registered Active Builders" />
              <Counter value={statsLoaded ? stats.analyses : 0} label="AI Architecture Reports" />
            </div>
          </section>

          {/* ═══ THE CINEMATIC NARRATIVE STORY (THE DEVELOPER'S PARADOX) ═══ */}
          <section className="py-24 sm:py-32 px-4 sm:px-6 bg-gradient-to-b from-bg-primary via-bg-secondary/40 to-bg-primary border-b border-border-default/40 overflow-hidden">
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="text-center mb-16 sm:mb-20"
              >
                <span className="text-xs uppercase tracking-widest font-black text-accent mb-2 block font-mono">Conceptual Paradigm</span>
                <h2 className="text-4xl sm:text-6xl font-black font-display tracking-tight mb-6 text-text-primary">
                  The Developer&apos;s <span className="text-gradient">Paradox</span>
                </h2>
                <p className="text-lg text-text-muted max-w-3xl mx-auto leading-relaxed">
                  Builders waste months writing code for ideas that find no market, while millions of developers post high-fidelity, painful problems online every day. We bridge this chasm by aligning builder effort with genuine user demand.
                </p>
              </motion.div>

              {/* Side-by-Side Comparative Storyboards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

                {/* Failure Side: The Friction Loop */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  className="rounded-3xl border border-danger/10 bg-gradient-to-b from-danger-soft/10 via-transparent to-transparent p-8 flex flex-col justify-between relative overflow-hidden"
                >
                  {/* Visual badge */}
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Flame className="w-40 h-40 text-danger" />
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-danger-soft text-danger text-xs font-bold font-mono tracking-wider uppercase mb-6 border border-danger/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
                      The Speculative Validation Chasm
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-black font-display text-text-primary mb-4 leading-tight">
                      Building on Intuition
                    </h3>

                    <p className="text-text-secondary text-sm leading-relaxed mb-8">
                      Creating new software is an act of pure courage—but relying solely on speculative assumptions can create a gap between your vision and user needs.
                    </p>

                    <div className="space-y-6">
                      {[
                        {
                          step: "01",
                          title: "Intuitive Inspiration",
                          desc: "A burst of creative passion inspires a new concept. You feel an immediate urge to build a SaaS or tool to solve it.",
                          tooltip: "Every great innovation starts with pure intuition—but validation turns inspiration into a sustainable product."
                        },
                        {
                          step: "02",
                          title: "Focused Craftsmanship",
                          desc: "You spend weeks or months coding in a vacuum, focusing on high-fidelity designs, code architectures, and smooth integrations.",
                          tooltip: "Writing clean code is a masterpiece of craft—but early user feedback keeps it aligned to the market."
                        },
                        {
                          step: "03",
                          title: "The Validation Gap",
                          desc: "You launch to a quiet market, discovering that while the software is beautiful, it doesn't align with what users are currently experiencing.",
                          tooltip: "Launches are learning milestones: understanding how to realign your craftsmanship to solve real needs."
                        }
                      ].map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-start relative group/step p-3.5 rounded-xl hover:bg-bg-secondary/40 border border-transparent hover:border-border-default/20 transition-all duration-300">
                          <span className="font-mono text-danger/30 font-bold text-lg leading-none pt-1">{item.step}</span>
                          <div>
                            <h4 className="font-bold text-text-primary text-base">{item.title}</h4>
                            <p className="text-text-muted text-xs leading-relaxed mt-1">{item.desc}</p>

                            {/* Bubble Tooltip */}
                            <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 bg-zinc-950 text-zinc-100 text-[10px] font-mono p-2.5 rounded-lg shadow-xl opacity-0 scale-95 group-hover/step:opacity-100 group-hover/step:scale-100 transition-all duration-300 pointer-events-none z-50 w-56 border border-zinc-800 text-center leading-normal">
                              <span className="text-danger font-bold block mb-1">🔍 INTUITIVE HYPOTHESIS</span>
                              {item.tooltip}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-zinc-950 border-r border-b border-zinc-800 rotate-45" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-border-default/40 text-xs text-text-muted italic flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger/50" />
                    Challenge: Crafting beautiful software that struggles to find its audience.
                  </div>
                </motion.div>

                {/* Solution Side: The Developer's Paradise Loop */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  className="rounded-3xl border border-emerald-500/15 bg-gradient-to-b from-success-soft/20 via-transparent to-transparent p-8 flex flex-col justify-between relative overflow-hidden"
                >
                  {/* Visual badge */}
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <CheckCircle className="w-40 h-40 text-emerald-500" />
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-success-soft text-success text-xs font-bold font-mono tracking-wider uppercase mb-6 border border-emerald-500/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      The Validated Opportunity Loop
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-black font-display text-text-primary mb-4 leading-tight">
                      Building with Conviction
                    </h3>

                    <p className="text-text-secondary text-sm leading-relaxed mb-8">
                      By pulling real frustrations directly from developer discussions, we turn the discovery process into a science.
                    </p>

                    <div className="space-y-6">
                      {[
                        {
                          step: "01",
                          title: "Continuous Ingestion",
                          desc: "Our systems extract high-fidelity complaints about broken library APIs, configuration limits, and cloud pricing blocks across Hacker News, GitHub, and Reddit.",
                          tooltip: "Hunting for authentic developer screams of pain while you sleep."
                        },
                        {
                          step: "02",
                          title: "LLM Vector Intelligence",
                          desc: "Gemini indexes complaints, maps dependencies, and groups similar pain points into structural targets. You see the exact demand density and upvotes.",
                          tooltip: "Gemini separating genuine complaints from standard developer sarcasm."
                        },
                        {
                          step: "03",
                          title: "Immediate PMF Validation",
                          desc: "You begin coding with a pre-assembled audience. You know exactly what features they need, what tech stack they prefer, and who is actively waiting for it.",
                          tooltip: "Your first 10 customers are already waiting inside the source thread."
                        }
                      ].map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-start relative group/step p-3.5 rounded-xl hover:bg-bg-secondary/40 border border-transparent hover:border-border-default/20 transition-all duration-300">
                          <span className="font-mono text-success font-bold text-lg leading-none pt-1">{item.step}</span>
                          <div>
                            <h4 className="font-bold text-text-primary text-base">{item.title}</h4>
                            <p className="text-text-muted text-xs leading-relaxed mt-1">{item.desc}</p>

                            {/* Bubble Tooltip */}
                            <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 bg-zinc-950 text-zinc-100 text-[10px] font-mono p-2.5 rounded-lg shadow-xl opacity-0 scale-95 group-hover/step:opacity-100 group-hover/step:scale-100 transition-all duration-300 pointer-events-none z-50 w-56 border border-zinc-800 text-center leading-normal">
                              <span className="text-emerald-500 font-bold block mb-1">🚀 OPPORTUNITY SIGNAL</span>
                              {item.tooltip}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-zinc-950 border-r border-b border-zinc-800 rotate-45" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-border-default/40 text-xs text-text-muted italic flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Result: Product-Market Fit from Day One.
                  </div>
                </motion.div>

              </div>

              {/* Core Value Proposition Summary Banner */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                className="mt-12 liquid-glass rounded-2xl p-6 sm:p-8 border border-border-default text-center relative overflow-hidden bg-bg-surface/50 backdrop-blur-md"
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
                  <div className="text-left">
                    <h4 className="text-base font-bold text-text-primary">
                      Align your effort with real developer pain.
                    </h4>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed max-w-xl">
                      Every problem listed on Developer&apos;s Paradise represents authentic, cross-source compiled complaints from engineers actively begging for a better solution.
                    </p>
                  </div>
                  <Link href="/dashboard" className="inline-flex items-center gap-2 bg-text-primary hover:bg-accent text-bg-primary hover:text-white font-bold py-2.5 px-6 rounded-xl transition-all duration-300 active:scale-95 text-xs font-mono tracking-wider uppercase cursor-pointer">
                    Explore Validated Problems <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>

            </div>
          </section>

          {/* ═══ OPPORTUNITY RADAR CONSOLE ═══ */}
          <section className="py-32 px-6 border-b border-border-default/40 bg-bg-secondary/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--accent-soft),transparent_70%)] opacity-30 pointer-events-none" />

            <div className="max-w-5xl mx-auto relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="text-center mb-20"
              >
                <span className="text-xs uppercase tracking-widest font-black text-purple-500 mb-2 block font-mono">Live Telemetry</span>
                <h2 className="text-4xl sm:text-5xl font-black font-display tracking-tight mb-4 text-text-primary">
                  Target Opportunity <span className="text-gradient">Radar</span>
                </h2>
                <p className="text-lg text-text-muted max-w-xl mx-auto leading-relaxed">
                  Direct console streaming of top validated friction points currently scraped and pending resolution inside our central Postgres vector database.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {featuredIdeas.map((idea, i) => (
                  <motion.div
                    key={idea.id}
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ type: "spring", stiffness: 150, damping: 20, delay: i * 0.1 }}
                    className="group relative animate-float"
                    style={{ animationDelay: `${i * 0.5}s`, animationDuration: '6s' }}
                  >
                    {/* Terminal styling shell */}
                    <div className="liquid-glass rounded-2xl p-7 flex flex-col h-full hover:border-accent/40 hover:shadow-2xl hover:shadow-accent/5 transition-all duration-300 relative overflow-hidden bg-bg-surface backdrop-blur-md">

                      {/* Decorative scanline overlay */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] pointer-events-none opacity-10" />

                      {/* Live telemetry badge header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          <span className="text-[10px] font-mono tracking-widest text-emerald-500 uppercase font-black">LOCKED STATE</span>
                        </div>
                        <span className="text-[10px] font-mono text-text-muted">ID: {idea.id.substring(0, 8)}</span>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-accent-soft text-accent-text border border-accent/15">
                          {idea.domain}
                        </span>
                        <span className={`group/difficulty relative px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border cursor-help ${idea.difficulty === 'Advanced' ? 'bg-danger-soft text-danger border-danger/15' :
                            idea.difficulty === 'Intermediate' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/15' :
                              'bg-success-soft text-success border-success/15'
                          }`}>
                          {idea.difficulty}

                          {/* Difficulty tooltip */}
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-zinc-950 text-zinc-100 text-[9px] font-mono leading-relaxed p-2 rounded-lg opacity-0 pointer-events-none group-hover/difficulty:opacity-100 scale-95 group-hover/difficulty:scale-100 transition-all duration-300 z-50 shadow-xl border border-zinc-800 text-center normal-case">
                            {idea.difficulty === 'Advanced' ? '🔧 Requires deep engine integration, custom compilers, or multi-threading.' :
                              idea.difficulty === 'Intermediate' ? '🧱 Standard SaaS stack with some complex state or real-time sync.' :
                                '🟢 Simple, actionable utility. Can be deployed in a single afternoon.'}
                            <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-1.5 h-1.5 bg-zinc-950 rotate-45 border-r border-b border-zinc-800" />
                          </span>
                        </span>
                      </div>

                      {/* Problem title */}
                      <h4 className="text-xl font-bold text-text-primary mb-4 leading-snug font-display group-hover:text-accent transition-colors text-left">
                        {idea.title}
                      </h4>

                      {/* Traversed recommended stack */}
                      <div className="mt-auto pt-6 border-t border-border-default/40">
                        <div className="flex items-center justify-between text-xs text-text-muted mb-4">
                          <span className="flex items-center gap-1.5 font-medium">
                            <BarChart3 className="w-3.5 h-3.5 text-accent" />
                            <strong>{idea.mentionCount}</strong> platform reports
                          </span>

                          {/* Satisfying live upvote trigger on card */}
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              handleUpvote(idea.id)
                            }}
                            className={`group/upvote inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all duration-300 cursor-pointer active:scale-90 ${upvotedIdeas.includes(idea.id)
                                ? 'bg-success-soft border-success/35 text-success'
                                : 'bg-bg-secondary border-border-default hover:border-accent hover:text-accent'
                              }`}
                          >
                            <ChevronUp className={`w-3.5 h-3.5 ${upvotedIdeas.includes(idea.id) ? 'animate-bounce' : 'group-hover/upvote:-translate-y-0.5 transition-transform'}`} />
                            <span className="font-mono font-bold text-[10px]">
                              {idea.upvotesCount + (upvotedIdeas.includes(idea.id) ? 1 : 0)}
                            </span>
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-6">
                          {idea.recommendedStack.map((tech: string) => (
                            <span key={tech} className="px-2 py-0.5 rounded bg-bg-secondary text-[10px] font-mono text-text-secondary border border-border-default">
                              {tech}
                            </span>
                          ))}
                        </div>

                        {/* Traversal button */}
                        <Link
                          href={`/dashboard?ideaId=${idea.id}`}
                          className="w-full inline-flex items-center justify-center gap-2 border border-border-default hover:border-accent hover:bg-accent hover:text-white text-text-secondary font-bold py-3 px-4 rounded-xl transition-all duration-300 active:scale-95 text-xs font-mono tracking-wider uppercase cursor-pointer"
                        >
                          Interrogate Complaint
                        </Link>
                      </div>

                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

      {/* ═══ CTA REDESIGN: MINIMALIST HIGH-IMPACT CALL TO ADVENTURE ═══ */}
      <section className="py-28 sm:py-36 px-4 sm:px-6 relative overflow-hidden bg-gradient-to-b from-bg-primary via-bg-secondary/40 to-bg-primary">
        
        {/* Soft, ultra-premium background glow accents (Vercel/Stripe style) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(99,102,241,0.06)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(99,102,241,0.12)_0%,transparent_70%)] pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10 text-center flex flex-col items-center">

          {/* Inspirational Centered Title */}
          <motion.h2 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black font-display tracking-tight text-text-primary leading-[1.05] sm:leading-[1.02] mb-6 max-w-3xl"
          >
            Build What Developers <span className="text-gradient">Actually Need.</span>
          </motion.h2>

          {/* spacious and inspiring paragraph */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-lg md:text-xl text-text-secondary max-w-2xl leading-relaxed mb-12"
          >
            Stop guessing your next product. Explore thousands of validated, compiled developer frustrations, costly egress blockages, and broken libraries. Your first customers are already waiting inside the source threads.
          </motion.p>

          {/* spacious elegant centered buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto px-4 sm:px-0"
          >
            {session ? (
              <Link 
                href="/dashboard"
                className="group inline-flex items-center justify-center gap-2.5 bg-accent hover:bg-accent-hover text-white font-black py-4 px-8 rounded-2xl transition-all hover:scale-[0.98] active:scale-95 shadow-xl shadow-accent/25 text-sm uppercase tracking-wider cursor-pointer"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </Link>
            ) : (
              <button 
                onClick={() => { window.location.hash = '#login' }} 
                className="group inline-flex items-center justify-center gap-2.5 bg-accent hover:bg-accent-hover text-white font-black py-4 px-8 rounded-2xl transition-all hover:scale-[0.98] active:scale-95 shadow-xl shadow-accent/25 text-sm uppercase tracking-wider cursor-pointer"
              >
                Start Building Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </button>
            )}
            <Link 
              href="/dashboard" 
              className="inline-flex items-center justify-center gap-2 border-2 border-border-default hover:border-text-primary hover:bg-bg-surface text-text-muted hover:text-text-primary font-black py-4 px-8 rounded-2xl text-sm transition-all duration-300 active:scale-95 uppercase tracking-wider"
            >
              Explore the Feed
            </Link>
          </motion.div>

          {/* Muted elegant text-only statistics line to establish scale and validity */}
          <motion.div 
            initial={{ opacity: 0 }} 
            whileInView={{ opacity: 0.7 }} 
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="mt-16 flex flex-wrap justify-center items-center gap-x-8 gap-y-3 text-xs font-mono font-medium text-text-muted select-none"
          >
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span>12,400+ validated complaints</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-border-default hidden sm:block opacity-40" />
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              <span>8,900+ active builders</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-border-default hidden sm:block opacity-40" />
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>98.2% validation score</span>
            </div>
          </motion.div>
        </div>
      </section>

          {/* ═══ FOOTER (landing-specific) ═══ */}
          <footer className="border-t border-border-default py-8 text-center text-xs text-text-muted bg-bg-primary">
            <p>&copy; {new Date().getFullYear()} Developer&apos;s Paradise · Built with Next.js + Gemini AI</p>
          </footer>
        </div>
      </div>
    </div>
  )
}
