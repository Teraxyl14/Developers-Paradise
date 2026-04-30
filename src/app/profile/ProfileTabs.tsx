"use client"
import { useState } from "react"
import { IdeaCard } from "@/components/IdeaCard"
import { motion } from "framer-motion"
import { Settings, Lightbulb, Bookmark, GitBranch, ArrowUpRight } from "lucide-react"

const tabs = [
  { key: "edit", label: "Edit Profile", icon: Settings },
  { key: "ideas", label: "My Ideas", icon: Lightbulb },
  { key: "saved", label: "Saved", icon: Bookmark },
  { key: "projects", label: "Projects", icon: GitBranch },
]

export function ProfileTabs({ editForm, submittedIdeas, savedIdeas, repositories }: {
  editForm: React.ReactNode,
  submittedIdeas: any[],
  savedIdeas: any[],
  repositories: any[]
}) {
  const [active, setActive] = useState("edit");

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-1 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 rounded-xl p-1 mb-6 shadow-sm overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all relative whitespace-nowrap ${
              active === tab.key
                ? 'text-zinc-900 dark:text-zinc-50'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/[0.04]'
            }`}
          >
            {active === tab.key && (
              <motion.div layoutId="profile-tab" className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 rounded-lg -z-10 border border-zinc-200/50 dark:border-white/[0.08] shadow-sm" />
            )}
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {active === "edit" && editForm}

      {active === "ideas" && (
        <div className="space-y-4">
          {submittedIdeas.length === 0 && (
            <div className="text-center py-16 text-zinc-500 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl">
              <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">You haven&apos;t submitted any ideas yet.</p>
            </div>
          )}
          {submittedIdeas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}

      {active === "saved" && (
        <div className="space-y-4">
          {savedIdeas.length === 0 && (
            <div className="text-center py-16 text-zinc-500 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl">
              <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No saved ideas yet.</p>
            </div>
          )}
          {savedIdeas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}

      {active === "projects" && (
        <div className="space-y-3">
          {repositories.length === 0 && (
            <div className="text-center py-16 text-zinc-500 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl">
              <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No repositories linked yet.</p>
            </div>
          )}
          {repositories.map((repo: any) => (
            <div key={repo.id} className="bg-white dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-white/10 shadow-sm">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Building solution for: <span className="text-zinc-900 dark:text-white font-medium">{repo.idea.title}</span></p>
              <a href={repo.url} target="_blank" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-medium break-all flex items-center gap-1.5 text-sm">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {repo.url}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
