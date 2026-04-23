import { submitIdea } from "@/actions/submissions"
import { PlusCircle, Lightbulb, Clock, Code, Globe, Layers } from "lucide-react"
import { SubmitButton } from "@/components/SubmitButton"

export default function SubmitIdeaPage() {
  return (
    <main className="max-w-2xl mx-auto py-12 px-4 md:px-6 text-zinc-900 dark:text-white">
      <div className="mb-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20 mb-4">
          <Lightbulb className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Submit a Pain Point</h1>
        <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
          What&apos;s a problem you constantly face as a developer that someone should build a tool for?
        </p>
      </div>
      
      <form action={submitIdea} className="space-y-5">
        <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] shadow-sm overflow-hidden">
          {/* Title */}
          <div className="p-5 border-b border-zinc-100 dark:border-white/[0.04]">
            <label className="flex items-center gap-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
              <Lightbulb className="w-3.5 h-3.5" /> Project Idea Title
            </label>
            <input 
              name="title" 
              required 
              className="w-full bg-transparent text-lg font-semibold text-zinc-900 dark:text-white focus:outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 transition-colors"
              placeholder="e.g. Serverless Redis Connection Manager" 
            />
          </div>
          
          {/* Description */}
          <div className="p-5 border-b border-zinc-100 dark:border-white/[0.04]">
            <label className="flex items-center gap-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
              <Code className="w-3.5 h-3.5" /> Description
            </label>
            <textarea 
              name="description" 
              required 
              rows={4} 
              className="w-full bg-transparent text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 leading-relaxed resize-none transition-colors"
              placeholder="Describe the pain point clearly — who faces it, how often, and what a solution would look like..." 
            />
          </div>

          {/* Grid row */}
          <div className="grid grid-cols-2 divide-x divide-zinc-100 dark:divide-white/[0.04] border-b border-zinc-100 dark:border-white/[0.04]">
            <div className="p-5">
              <label className="flex items-center gap-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                <Layers className="w-3.5 h-3.5" /> Difficulty
              </label>
              <select 
                name="difficulty" 
                className="w-full bg-transparent text-sm font-medium text-zinc-900 dark:text-white focus:outline-none cursor-pointer appearance-none"
              >
                <option value="Beginner">🟢 Beginner</option>
                <option value="Intermediate">🟡 Intermediate</option>
                <option value="Advanced">🔴 Advanced</option>
              </select>
            </div>
            <div className="p-5">
              <label className="flex items-center gap-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                <Clock className="w-3.5 h-3.5" /> Estimated Time
              </label>
              <input 
                name="devTime" 
                required 
                className="w-full bg-transparent text-sm font-medium text-zinc-900 dark:text-white focus:outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 transition-colors"
                placeholder="e.g. 1-2 weeks" 
              />
            </div>
          </div>

          {/* Domain */}
          <div className="p-5 border-b border-zinc-100 dark:border-white/[0.04]">
            <label className="flex items-center gap-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
              <Globe className="w-3.5 h-3.5" /> Problem Domain
            </label>
            <input 
              name="domain" 
              required 
              className="w-full bg-transparent text-sm font-medium text-zinc-900 dark:text-white focus:outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 transition-colors"
              placeholder="e.g. Web Dev, DevOps, Security" 
            />
          </div>

          {/* Stack */}
          <div className="p-5">
            <label className="flex items-center gap-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
              <Code className="w-3.5 h-3.5" /> Recommended Tech Stack
            </label>
            <input 
              name="recommendedStack" 
              required 
              className="w-full bg-transparent text-sm font-medium text-zinc-900 dark:text-white focus:outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 transition-colors"
              placeholder="e.g. Next.js, Postgres, Redis (comma separated)" 
            />
          </div>
        </div>

        <SubmitButton 
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 flex items-center justify-center gap-2" 
          loadingText="Analyzing & Submitting..."
        >
          <PlusCircle className="w-4 h-4" /> Submit Idea
        </SubmitButton>
      </form>
    </main>
  )
}
