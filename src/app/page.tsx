"use client"
import { Suspense, useState, useEffect, useRef } from "react"
import { Canvas } from "@react-three/fiber"
import { motion, useScroll, useTransform } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Search, Bot, Rocket, BarChart3, Code2, Sun, Moon } from "lucide-react"
import { NetworkEarth, SpaceParticles } from "@/components/EarthScene"
import { useTheme } from "next-themes"

/* ── Feature cards ── */
const features = [
  { icon: Search, title: "AI-Powered Discovery", desc: "We scrape GitHub, StackOverflow, and dev forums to surface validated problems — not hypothetical ideas.", color: "from-blue-500 to-cyan-500" },
  { icon: Bot, title: "Market Intelligence", desc: "Gemini AI analyzes competitors, scores market saturation, and generates wedge strategies for every idea.", color: "from-indigo-500 to-purple-500" },
  { icon: Rocket, title: "Build & Ship", desc: "Link your repo, get an AI architecture roast, run Lighthouse audits, and climb the leaderboard.", color: "from-purple-500 to-pink-500" },
]

const sampleCards = [
  { title: "Real-Time Collaboration Lag", domain: "DevTools", difficulty: "Advanced", viability: "94%", stack: ["WebRTC", "CRDT", "Rust"] },
  { title: "CI/CD Pipeline Bottlenecks", domain: "Infrastructure", difficulty: "Intermediate", viability: "87%", stack: ["Go", "Docker", "K8s"] },
  { title: "API Rate-Limit Intelligence", domain: "Backend", difficulty: "Intermediate", viability: "91%", stack: ["Redis", "Node.js", "GraphQL"] },
]

/* ── Animated counter ── */
function Counter({ value, label }: { value: string; label: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
      <div className="text-3xl md:text-4xl font-black font-display text-text-primary stat-number">{value}</div>
      <div className="text-xs text-text-muted uppercase tracking-wider font-semibold mt-1">{label}</div>
    </motion.div>
  )
}

export default function LandingPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Track page scroll to drive the 3D camera
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // Animation values for the background riser text (rising from behind the globe)
  const riserY = useTransform(scrollYProgress, [0, 0.4], ["0vh", "-15vh"])
  const riserOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])

  return (
    <div ref={containerRef} className="text-text-primary min-h-screen relative">
      
      {/* ═══ LAYER 1: BACKGROUND STARS ═══ */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <Suspense fallback={null}>
          <Canvas camera={{ position: [0, 0, 3.8], fov: 45 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
            <SpaceParticles theme={theme as string} />
          </Canvas>
        </Suspense>
      </div>

      {/* ═══ LAYER 2: BACKGROUND RISER TEXT ═══ */}
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden pb-[20vh] sm:pb-[10vh]">
        <motion.h1 
          style={{ y: riserY, opacity: riserOpacity, fontFamily: "var(--font-bebas)" }}
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

        {/* Inline nav */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-5 max-w-6xl mx-auto w-full">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden border border-border-default shadow-lg shadow-accent/10 group-hover:scale-105 transition-transform">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold font-display text-text-primary text-lg hidden sm:inline">DevParadise</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-1.5 sm:p-2 rounded-lg hover:bg-bg-surface transition-colors text-text-muted hover:text-text-primary">
              {mounted ? (theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />) : <div className="w-4 h-4" />}
            </button>
            <a href="#login" className="text-xs sm:text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors">Sign In</a>
            <Link href="/dashboard" className="text-xs sm:text-sm font-semibold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-accent text-white hover:bg-accent-hover transition-colors">Explore</Link>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 text-center max-w-3xl px-4 sm:px-6 mt-2 sm:mt-8">


          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.4 }} className="text-4xl sm:text-6xl md:text-8xl font-black font-display leading-[1.0] sm:leading-[0.92] tracking-tight mb-4 sm:mb-6 drop-shadow-[0_4px_10px_rgba(0,0,0,0.05)] dark:drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)] text-text-primary">
            Developers <span className="text-gradient">Paradise</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }} className="text-lg md:text-xl text-text-primary max-w-2xl mx-auto leading-relaxed mb-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.05)] dark:drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            The ultimate platform to discover, build, and ship solutions for real developer problems. Stop guessing—solve what the market actually needs right now.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.1 }} className="flex flex-col sm:flex-row gap-4 justify-center w-full px-4 sm:px-0">
            <a href="#login" className="group inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-bold py-3.5 px-8 rounded-2xl transition-all hover:scale-[0.98] active:scale-95 shadow-lg shadow-accent/20 text-sm w-full sm:w-auto">
              Get Started Free <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
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
        
        {/* ═══ STATS ═══ */}
        <section className="border-y border-border-default bg-bg-secondary/50 backdrop-blur-sm py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <Counter value="2,400+" label="Problems Discovered" />
          <Counter value="150+" label="Active Builders" />
          <Counter value="800+" label="AI Analyses Run" />
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black font-display tracking-tight mb-4 text-text-primary">How it works</h2>
            <p className="text-lg text-text-muted max-w-xl mx-auto">We capture the chaos. You engineer the solution.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, delay: i * 0.1 }} className="liquid-glass rounded-2xl p-8 group hover:border-border-hover transition-all">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-lg`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-3 font-display">{f.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SAMPLE PROBLEMS ═══ */}
      <section className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black font-display tracking-tight mb-4 text-text-primary">See what&apos;s waiting</h2>
            <p className="text-lg text-text-muted max-w-xl mx-auto">Real problems from real developers, validated and ready to solve.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sampleCards.map((card, i) => (
              <motion.div key={card.title} initial={{ opacity: 0, y: 50, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, margin: "-60px" }} transition={{ type: "spring", stiffness: 200, damping: 22, delay: i * 0.1 }}>
                <div className="liquid-glass rounded-2xl p-7 group hover:border-border-hover transition-all h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-accent-soft text-accent-text border border-accent/15">{card.domain}</span>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-bg-surface text-text-muted border border-border-default">{card.difficulty}</span>
                  </div>
                  <h4 className="text-xl font-bold text-text-primary mb-4 leading-tight font-display">{card.title}</h4>
                  <div className="flex items-center gap-4 text-xs text-text-muted">
                    <span className="flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-emerald-500" /> {card.viability}</span>
                    <span className="flex items-center gap-1.5"><Code2 className="w-3.5 h-3.5" /> {card.stack.join(", ")}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-28 px-6">
        <div className="max-w-lg mx-auto">
          <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, margin: "-80px" }} transition={{ type: "spring", stiffness: 150, damping: 20 }} className="liquid-glass rounded-[32px] p-10 md:p-14 text-center relative overflow-hidden animate-pulse-glow">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
            <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-accent to-indigo-700 flex items-center justify-center shadow-lg shadow-accent/20">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight mb-3 text-text-primary">Claim your problem.</h2>
            <p className="text-text-muted text-base mb-10 max-w-sm mx-auto leading-relaxed">
              Stop building tutorials. Start solving real problems that real companies actually need.
            </p>
            <a href="#login" className="group inline-flex items-center justify-center gap-2.5 w-full bg-accent hover:bg-accent-hover text-white font-bold py-4 px-8 rounded-2xl transition-all hover:scale-[0.98] active:scale-95 shadow-lg shadow-accent/20 text-base">
              Create Account & View Feed <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <Link href="/dashboard" className="mt-4 inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border border-border-default hover:bg-bg-surface text-text-muted hover:text-text-primary font-semibold text-sm transition-all">
              Browse First
            </Link>
          </motion.div>
        </div>
      </section>

        {/* ═══ FOOTER (landing-specific) ═══ */}
        <footer className="border-t border-border-default py-8 text-center text-xs text-text-muted bg-bg-primary">
          <p>&copy; {new Date().getFullYear()} Developers Paradise · Built with Next.js + Gemini AI</p>
        </footer>
      </div>
    </div>
  )
}
