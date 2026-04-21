import { submitIdea } from "@/actions/submissions"
import { PlusCircle } from "lucide-react"
import { SubmitButton } from "@/components/SubmitButton"

export default function SubmitIdeaPage() {
  return (
    <main className="max-w-2xl mx-auto py-12 px-4 text-zinc-900 dark:text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <PlusCircle className="w-8 h-8 text-blue-500" />
          Submit a Pain Point
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">What is a problem you constantly face as a developer that someone should build a tool for?</p>
      </div>
      
      <form action={submitIdea} className="space-y-6 bg-white dark:bg-zinc-900/50 p-8 rounded-xl border border-zinc-200 dark:border-white/10 shadow-sm dark:shadow-none">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Project Idea Title</label>
          <input name="title" required className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600" placeholder="e.g. Serverless Redis Connection Manager" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Description</label>
          <textarea name="description" required rows={4} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600" placeholder="Describe the pain point and the proposed solution..." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Difficulty</label>
            <select name="difficulty" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all">
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Estimated Time</label>
            <input name="devTime" required className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600" placeholder="e.g. 1-2 weeks" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Problem Domain</label>
          <input name="domain" required className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600" placeholder="e.g. Web Dev, DevOps, Security" />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Recommended Tech Stack (Comma separated)</label>
          <input name="recommendedStack" required className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600" placeholder="e.g. Next.js, Postgres, Redis" />
        </div>

        <div className="pt-2">
          <SubmitButton className="w-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-bold py-3.5 px-4 rounded-lg transition-colors shadow-sm" loadingText="Submitting Idea...">
            Submit Idea
          </SubmitButton>
        </div>
      </form>
    </main>
  )
}
