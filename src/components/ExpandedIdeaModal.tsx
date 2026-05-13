"use client"
import { motion } from "framer-motion"
import { useEffect } from "react"
import { X, Clock, ExternalLink, MessageSquare, HandMetal } from "lucide-react"
import { useRouter } from "next/navigation"

export function ExpandedIdeaModal({ idea }: { idea: any }) {
  const router = useRouter()

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  const close = () => {
    router.back();
  }

  if (!idea) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 pt-[10vh] md:pt-8 pointer-events-none">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-bg-primary/60 backdrop-blur-md pointer-events-auto"
        onClick={close}
      />
      
      <motion.div 
        layoutId={`card-${idea.id}`}
        className="relative w-full max-w-4xl max-h-full overflow-y-auto liquid-glass rounded-3xl p-8 pointer-events-auto shadow-2xl"
      >
        <button 
          onClick={close}
          className="absolute top-6 right-6 p-2 text-text-muted hover:text-text-primary bg-bg-surface hover:bg-bg-surface-hover rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col gap-6">
          <div>
            <motion.h2 layoutId={`title-${idea.id}`} className="text-3xl md:text-4xl font-bold text-text-primary font-display mb-4 pr-12">
              {idea.title}
            </motion.h2>
            
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1 rounded-full bg-accent-soft border border-accent/10 text-xs font-semibold text-accent-text">
                {idea.domain}
              </span>
              <span className="px-3 py-1 rounded-full bg-bg-surface border border-border-default text-xs font-semibold text-text-secondary">
                {idea.difficulty}
              </span>
              <span className="px-3 py-1 rounded-full bg-bg-surface border border-border-default text-xs font-semibold text-text-secondary flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {idea.devTime}
              </span>
            </div>
          </div>

          <motion.div layoutId={`desc-${idea.id}`} className="text-text-secondary text-base md:text-lg leading-relaxed whitespace-pre-wrap">
            {idea.description}
          </motion.div>

          <div className="flex flex-wrap gap-2 mt-4">
            {idea.recommendedStack.map((stack: string) => (
              <span key={stack} className="px-2.5 py-1 text-xs font-medium text-accent-text bg-accent-soft border border-accent/15 rounded-md">
                {stack}
              </span>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-3 items-center mt-8 pt-8 border-t border-border-default">
            {idea.sourceUrl && (
              <a href={idea.sourceUrl} target="_blank" className="flex items-center gap-1.5 px-6 py-3 rounded-xl text-sm font-bold bg-accent text-white hover:bg-accent-hover hover:scale-[0.98] transition-all">
                Source <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button className="flex items-center gap-1.5 px-6 py-3 rounded-xl text-sm font-bold bg-bg-surface border border-border-default text-text-primary hover:bg-bg-surface-hover transition-all hover:scale-[0.98]">
              Discuss <MessageSquare className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-1.5 px-6 py-3 rounded-xl text-sm font-bold bg-bg-surface border border-border-default text-text-primary hover:bg-bg-surface-hover transition-all hover:scale-[0.98]">
              Join Waitlist <HandMetal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
