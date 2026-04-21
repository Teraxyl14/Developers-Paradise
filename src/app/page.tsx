"use client"
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Terminal } from "lucide-react";

export default function Home() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[90vh] px-4 text-center overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="z-10 flex flex-col items-center"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full border border-blue-500/20 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 text-xs font-semibold uppercase tracking-wide">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          AI-Powered Problem Discovery
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl mb-6 text-zinc-950 dark:text-white max-w-4xl drop-shadow-sm">
          Build what people <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-500">actually want.</span>
        </h1>
        
        <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-2xl leading-relaxed">
          Stop building another generic todo app. We aggregate, parse, and categorize real software developer pain points straight from GitHub so you can build tools people will pay for.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link 
            href="/dashboard" 
            className="group relative flex items-center justify-center gap-2 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold py-3 px-8 rounded-lg transition-all hover:bg-zinc-800 dark:hover:bg-zinc-200"
          >
            Explore Ideas
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link 
            href="/api/auth/signin" 
            className="flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 text-zinc-900 dark:text-white font-medium py-3 px-8 rounded-lg transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <Terminal className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            Developer Login
          </Link>
        </div>
      </motion.div>

      {/* Decorative background blurs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
    </div>
  );
}
