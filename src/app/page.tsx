"use client"
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Search, GitBranch, BarChart3, Lightbulb, Bot, Rocket, ChevronRight } from "lucide-react";

const stats = [
  { label: "Problems Discovered", value: "2,400+", icon: Search },
  { label: "Active Builders", value: "150+", icon: GitBranch },
  { label: "AI Analyses Run", value: "800+", icon: Bot },
]

const features = [
  {
    icon: Search,
    title: "AI-Powered Discovery",
    description: "We scrape GitHub discussions, StackOverflow, and developer forums to find validated problems — not hypothetical ideas.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Bot,
    title: "Market Intelligence",
    description: "Gemini AI analyzes competitors, calculates market saturation, and generates wedge strategies for each idea.",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    icon: Rocket,
    title: "Build & Ship",
    description: "Link your repo, get an AI architecture roast, run Lighthouse audits, and climb the leaderboard as you ship solutions.",
    gradient: "from-purple-500 to-pink-500",
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } }
}

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* ──── HERO ──── */}
      <section className="relative flex flex-col items-center justify-center min-h-[92vh] px-4 text-center">
        {/* Decorative elements */}
        <div className="absolute inset-0 dot-pattern opacity-40 dark:opacity-20 pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-purple-400/8 dark:bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="z-10 flex flex-col items-center max-w-4xl"
        >
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            AI-Powered Problem Discovery
          </motion.div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 text-zinc-900 dark:text-white leading-[1.1]">
            Build what devs{" "}
            <span className="text-gradient">actually need.</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-2xl leading-relaxed">
            Stop guessing. We scrape, parse, and rank <strong className="text-zinc-900 dark:text-zinc-200">real developer problems</strong> from across the web — so you build tools people will pay for.
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link 
              href="/api/auth/signin" 
              className="group relative flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold py-3 px-8 rounded-xl transition-all hover:bg-zinc-800 dark:hover:bg-zinc-100 shadow-lg shadow-zinc-900/10 dark:shadow-white/10 hover:shadow-xl hover:shadow-zinc-900/20 dark:hover:shadow-white/20 hover:-translate-y-0.5"
            >
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/dashboard" 
              className="flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 text-zinc-700 dark:text-zinc-300 font-medium py-3 px-8 rounded-xl transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:-translate-y-0.5 shadow-sm"
            >
              <Search className="w-4 h-4 text-zinc-400" />
              Browse Ideas
            </Link>
          </div>

          {/* Stats */}
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-wrap items-center justify-center gap-8 mt-16"
          >
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={item} className="flex flex-col items-center gap-1">
                <stat.icon className="w-4 h-4 text-zinc-400 dark:text-zinc-500 mb-1" />
                <span className="text-2xl font-bold stat-number text-zinc-900 dark:text-white">{stat.value}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-500 font-medium">{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-400 dark:text-zinc-600"
        >
          <span className="text-[10px] uppercase tracking-[0.2em] font-medium">Scroll</span>
          <div className="w-5 h-8 rounded-full border-2 border-zinc-300 dark:border-zinc-700 flex items-start justify-center p-1">
            <motion.div 
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-1 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600"
            />
          </div>
        </motion.div>
      </section>

      {/* ──── FEATURES ──── */}
      <section className="relative max-w-6xl mx-auto px-4 md:px-6 py-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-4">
            <Zap className="w-3.5 h-3.5" /> How it works
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight mb-4">
            From problem to shipped product
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">Three steps to find your next project that people actually want to use.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="group relative bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/[0.06] rounded-2xl p-6 hover:border-zinc-300 dark:hover:border-white/10 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-zinc-900/5 dark:hover:shadow-none"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{feature.description}</p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more <ChevronRight className="w-3 h-3" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ──── CTA BANNER ──── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-24">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-2xl bg-zinc-900 dark:bg-zinc-900/80 p-10 md:p-14 text-center border border-zinc-800 dark:border-white/[0.06]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-600/20 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10">
            <Lightbulb className="w-8 h-8 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">Ready to build something that matters?</h2>
            <p className="text-zinc-400 mb-8 max-w-lg mx-auto">Join developers who skip the guesswork and build validated solutions to real problems.</p>
            <Link 
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-white text-zinc-900 font-semibold py-3 px-8 rounded-xl hover:bg-zinc-100 transition-all shadow-lg shadow-white/10 hover:-translate-y-0.5"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
