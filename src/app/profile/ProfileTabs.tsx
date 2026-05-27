"use client"
import { useState } from "react"
import { IdeaCard } from "@/components/IdeaCard"
import { motion } from "framer-motion"
import { Settings, Lightbulb, Bookmark, GitBranch, ArrowUpRight } from "lucide-react"
import { ExpandedIdeaModal } from "@/components/ExpandedIdeaModal"
import { AnimatePresence } from "framer-motion"

const tabs = [
  { key: "ideas", label: "Posts", icon: Lightbulb },
  { key: "saved", label: "Saved Ideas", icon: Bookmark },
  { key: "projects", label: "Projects & Repos", icon: GitBranch },
  { key: "edit", label: "Edit Profile", icon: Settings },
]

export interface ProfileIdea {
  id: string
  title: string
  description?: string | null
  domain: string
  devTime?: string | null
  upvotes?: unknown[]
  _count?: {
    upvotes: number
    comments: number
  }
}

export interface ProfileRepository {
  id: string
  url: string
  idea: {
    title: string
  }
}

export function ProfileTabs({ editForm, submittedIdeas, savedIdeas, repositories }: {
  editForm: React.ReactNode,
  submittedIdeas: ProfileIdea[],
  savedIdeas: ProfileIdea[],
  repositories: ProfileRepository[]
}) {
  // Default to "ideas" (Posts) to instantly load content like Reddit does!
  const [active, setActive] = useState("ideas");
  const [activeIdeaId, setActiveIdeaId] = useState<string | null>(null);
  
  const allIdeas = [...submittedIdeas, ...savedIdeas];
  const activeIdea = allIdeas.find(i => i.id === activeIdeaId);

  return (
    <div className="space-y-5">
      {/* Reddit-style Tab Navigation Header */}
      <div className="flex gap-1.5 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 rounded-2xl p-1 shadow-sm overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all relative whitespace-nowrap outline-none ${
              active === tab.key
                ? 'text-zinc-900 dark:text-zinc-50'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/[0.03]'
            }`}
          >
            {active === tab.key && (
              <motion.div 
                layoutId="profile-tab-pill" 
                className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-white/[0.08] shadow-sm rounded-xl -z-10" 
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <tab.icon className="w-4 h-4 shrink-0" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content Areas */}
      <div className="min-h-[250px]">
        {active === "edit" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {editForm}
          </motion.div>
        )}

        {active === "ideas" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {submittedIdeas.length === 0 && (
              <div className="text-center py-16 text-zinc-400 dark:text-zinc-500 border border-dashed border-zinc-300 dark:border-white/10 rounded-2xl bg-white dark:bg-zinc-900/10">
                <Lightbulb className="w-10 h-10 mx-auto mb-2.5 opacity-30 text-zinc-400" />
                <p className="text-sm font-semibold">No posts submitted yet</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">Share developer pain points or software ideas with the community!</p>
              </div>
            )}
            {submittedIdeas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} onClick={() => setActiveIdeaId(idea.id)} />
            ))}
          </motion.div>
        )}

        {active === "saved" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {savedIdeas.length === 0 && (
              <div className="text-center py-16 text-zinc-400 dark:text-zinc-500 border border-dashed border-zinc-300 dark:border-white/10 rounded-2xl bg-white dark:bg-zinc-900/10">
                <Bookmark className="w-10 h-10 mx-auto mb-2.5 opacity-30 text-zinc-400" />
                <p className="text-sm font-semibold">No saved ideas yet</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">Click the bookmark icon on any community idea card to save it here.</p>
              </div>
            )}
            {savedIdeas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} onClick={() => setActiveIdeaId(idea.id)} />
            ))}
          </motion.div>
        )}

        {active === "projects" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {repositories.length === 0 && (
              <div className="text-center py-16 text-zinc-400 dark:text-zinc-500 border border-dashed border-zinc-300 dark:border-white/10 rounded-2xl bg-white dark:bg-zinc-900/10">
                <GitBranch className="w-10 h-10 mx-auto mb-2.5 opacity-30 text-zinc-400" />
                <p className="text-sm font-semibold">No repositories linked yet</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">Link GitHub repositories to ideas you are building to track project progress.</p>
              </div>
            )}
            {repositories.map((repo) => (
              <div key={repo.id} className="bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm transition-all hover:border-zinc-300 dark:hover:border-white/20 group">
                <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-bold mb-1">Building solution for:</p>
                <h4 className="text-base font-bold text-zinc-900 dark:text-white mb-3 group-hover:text-accent transition-colors">{repo.idea.title}</h4>
                <a href={repo.url} target="_blank" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Visit Repository
                </a>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Expanded Modal Integration */}
      <AnimatePresence>
        {activeIdeaId && activeIdea && (
          <ExpandedIdeaModal idea={activeIdea} onClose={() => setActiveIdeaId(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
