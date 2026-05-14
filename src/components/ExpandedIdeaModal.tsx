"use client"
import { motion } from "framer-motion"
import { useEffect } from "react"
import { X, Clock, ExternalLink, MessageSquare, HandMetal, ChevronUp } from "lucide-react"
import { upvoteIdea, toggleWaitlist, addComment } from "@/actions/interactions"
import { useState } from "react"

import { useRouter } from "next/navigation"
import { useTransition } from "react"

export function ExpandedIdeaModal({ idea, onClose }: { idea: any, onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"details" | "discussion">("details");
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isUpvoted = idea.upvotes?.length > 0;
  const isWaitlisted = idea.waitlist?.length > 0;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const handleUpvote = async () => {
    startTransition(async () => {
      try {
        await upvoteIdea(idea.id);
        router.refresh();
      } catch (error) {
        console.error("Failed to upvote", error);
      }
    });
  };

  const handleWaitlist = async () => {
    startTransition(async () => {
      try {
        await toggleWaitlist(idea.id);
        router.refresh();
      } catch (error) {
        console.error("Failed to join waitlist", error);
      }
    });
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    startTransition(async () => {
      try {
        await addComment(idea.id, comment);
        setComment("");
        router.refresh();
      } catch (error) {
        console.error("Failed to add comment", error);
      }
    });
  };

  if (!idea) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-y-auto overflow-x-hidden flex flex-col items-center scrollbar-hide">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xl pointer-events-auto"
        onClick={onClose}
      />
      
      <div className="w-full min-h-screen py-6 px-4 md:py-12 flex items-center justify-center">
        <motion.div 
          layoutId={`card-${idea.id}`}
          className="relative w-full max-w-3xl bg-white/5 dark:bg-zinc-950/60 border border-white/10 dark:border-white/5 backdrop-blur-2xl rounded-[2rem] pointer-events-auto shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
        >
          {/* Header / Tabs */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5 backdrop-blur-xl sticky top-0 z-20">
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab("details")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all relative ${activeTab === "details" ? "text-white" : "text-text-muted hover:text-text-primary"}`}
              >
                {activeTab === "details" && (
                  <motion.div layoutId="modal-tab-bg" className="absolute inset-0 bg-accent rounded-xl -z-10 shadow-md shadow-accent/20" />
                )}
                Details
              </button>
              <button 
                onClick={() => setActiveTab("discussion")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all relative flex items-center gap-2 ${activeTab === "discussion" ? "text-white" : "text-text-muted hover:text-text-primary"}`}
              >
                {activeTab === "discussion" && (
                  <motion.div layoutId="modal-tab-bg" className="absolute inset-0 bg-accent rounded-xl -z-10 shadow-md shadow-accent/20" />
                )}
                Discussion 
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black border transition-colors ${activeTab === "discussion" ? "bg-white/20 border-white/20" : "bg-white/5 border-white/10"}`}>
                  {idea._count?.comments || 0}
                </span>
              </button>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-text-muted hover:text-text-primary bg-white/5 hover:bg-white/10 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 md:p-10">
            {activeTab === "details" ? (
              <div className="flex flex-col gap-8">
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  <button 
                    onClick={handleUpvote}
                    className={`flex flex-col items-center justify-center w-12 h-16 rounded-2xl border transition-all shrink-0 ${
                      isUpvoted 
                        ? "bg-accent/30 border-accent/50 text-accent-text shadow-[0_0_20px_rgba(var(--accent-rgb),0.2)]" 
                        : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-text-muted"
                    } ${isPending ? "opacity-70 grayscale" : ""}`}
                    disabled={isPending}
                  >
                    <ChevronUp className={`w-6 h-6 -mb-0.5 ${isUpvoted ? "text-accent" : ""}`} />
                    <span className="text-base font-black">{idea._count?.upvotes || 0}</span>
                  </button>

                  <div className="flex-1">
                    <motion.h2 layoutId={`title-${idea.id}`} className="text-3xl md:text-4xl font-black text-text-primary font-display leading-[1.1] mb-4 pr-12 tracking-tight">
                      {idea.title}
                    </motion.h2>
                    
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-lg bg-accent/10 border border-accent/10 text-[10px] font-black text-accent-text uppercase tracking-widest">
                        {idea.domain}
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black text-text-secondary uppercase tracking-widest">
                        {idea.difficulty}
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black text-text-secondary flex items-center gap-1.5 uppercase tracking-widest">
                        <Clock className="w-3.5 h-3.5" />
                        {idea.devTime}
                      </span>
                    </div>
                  </div>
                </div>

                <motion.div layoutId={`desc-${idea.id}`} className="text-text-primary/80 text-base md:text-lg leading-relaxed whitespace-pre-wrap font-medium max-w-2xl">
                  {idea.description}
                </motion.div>

                <div className="flex flex-wrap gap-2">
                  {idea.recommendedStack.map((stack: string) => (
                    <span key={stack} className="px-3 py-1 text-[10px] font-black text-accent-text bg-accent/5 border border-accent/10 rounded-lg uppercase tracking-widest">
                      {stack}
                    </span>
                  ))}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                  {idea.sourceUrl && (
                    <a href={idea.sourceUrl} target="_blank" className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-black bg-accent text-white hover:bg-accent-hover shadow-lg shadow-accent/20 transition-all active:scale-95">
                      Visit Source <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button 
                    onClick={handleWaitlist}
                    className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-black transition-all active:scale-95 border ${
                      isWaitlisted 
                        ? "bg-green-500/20 border-green-500/40 text-green-400" 
                        : "bg-white/5 border-white/10 text-text-primary hover:bg-white/10"
                    } ${isPending ? "opacity-70 grayscale" : ""}`}
                    disabled={isPending}
                  >
                    {isWaitlisted ? "On Waitlist" : "Join Waitlist"} <HandMetal className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setActiveTab("discussion")}
                    className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-black bg-white/5 border border-white/10 text-text-primary hover:bg-white/10 transition-all active:scale-95 ${isPending ? "opacity-70" : ""}`}
                  >
                    Discuss <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-text-primary">Discussion</h3>
                  <button onClick={() => setActiveTab("details")} className="text-xs font-bold text-accent hover:underline">Back to details</button>
                </div>
                
                <form onSubmit={handleComment} className="flex gap-3">
                  <input 
                    id="comment-input"
                    autoFocus
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all outline-none"
                  />
                  <button type="submit" className="px-6 py-3 bg-accent hover:bg-accent-hover text-white font-black rounded-xl transition-all active:scale-95">
                    Post
                  </button>
                </form>

                <div className="space-y-4">
                  {idea.comments?.length === 0 ? (
                    <div className="text-center py-12 text-text-muted text-sm border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                      No comments yet.
                    </div>
                  ) : (
                    idea.comments?.map((c: any) => (
                      <div key={c.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 hover:border-accent/20 transition-all">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center text-[10px] font-black text-accent border border-accent/10">
                            {c.user.name?.charAt(0) || "D"}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-text-primary">{c.user.name}</span>
                            <span className="text-[9px] text-text-faint font-bold uppercase tracking-wider">{new Date(c.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <p className="text-sm text-text-secondary leading-relaxed font-medium">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
