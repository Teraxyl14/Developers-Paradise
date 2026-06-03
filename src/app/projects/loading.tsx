import { Loader2 } from "lucide-react"

export default function ProjectsLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin relative z-10" />
      </div>
      <p className="text-sm font-mono text-text-muted animate-pulse">
        Fetching Problem Domain...
      </p>
    </div>
  )
}
