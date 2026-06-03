import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full" />
        <Loader2 className="w-8 h-8 text-accent animate-spin relative z-10" />
      </div>
      <p className="text-sm font-mono text-text-muted animate-pulse">
        Compiling UI...
      </p>
    </div>
  )
}
