"use client"
import { motion } from "framer-motion"
import { ChevronUp, MessageSquare, Clock } from "lucide-react"
import { upvoteIdea } from "@/actions/interactions"

import { useTransition } from "react"
import { useRouter } from "next/navigation"

export function IdeaCard({ idea, onClick }: { idea: any, onClick?: () => void }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isUpvoted = idea.upvotes?.length > 0;

  const handleUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      try {
        await upvoteIdea(idea.id);
        router.refresh();
      } catch (error) {
        console.error("Failed to upvote", error);
      }
    });
  };

  return (
    <motion.div 
      layoutId={`card-${idea.id}`}
      whileHover={{ scale: 0.995 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="group liquid-glass rounded-2xl p-5 text-text-primary transition-all cursor-pointer relative overflow-hidden"
    >
      <div className="flex gap-4">
        {/* Upvote Column */}
        <div className="flex flex-col items-center shrink-0">
          <button 
            onClick={handleUpvote}
            className={`flex flex-col items-center justify-center w-10 h-12 rounded-lg border transition-all ${
              isUpvoted 
                ? "bg-accent/20 border-accent/50 text-accent-text shadow-inner shadow-accent/10" 
                : "bg-bg-surface border-border-default hover:bg-bg-surface-hover hover:border-border-hover text-text-muted"
            } ${isPending ? "opacity-70 grayscale" : ""}`}
            disabled={isPending}
          >
            <ChevronUp className={`w-5 h-5 -mb-1 transition-colors ${isUpvoted ? "text-accent" : "group-hover:text-text-primary"}`} />
            <span className={`text-xs font-bold ${isUpvoted ? "text-accent-text" : "text-text-secondary"}`}>{idea._count?.upvotes || 0}</span>
          </button>
        </div>

        {/* Content Column */}
        <div className="flex-1 min-w-0">
          <motion.h3 layoutId={`title-${idea.id}`} className="text-lg font-bold font-display leading-tight mb-2 group-hover:text-accent-text transition-colors line-clamp-2">
            {idea.title}
          </motion.h3>
          
          <motion.p layoutId={`desc-${idea.id}`} className="text-xs text-text-muted line-clamp-2 mb-4 leading-relaxed">
            {idea.description}
          </motion.p>
          
          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-accent-soft text-accent-text border border-accent/10">
              {idea.domain}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-bg-surface text-text-secondary border border-border-default flex items-center gap-1">
              <Clock className="w-3 h-3" /> {idea.devTime}
            </span>
            <div className="flex-1" />
            <span className="flex items-center gap-1 text-[10px] font-medium text-text-muted">
              <MessageSquare className="w-3 h-3" />
              {idea._count?.comments || 0}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
