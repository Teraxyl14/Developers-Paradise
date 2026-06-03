import { Compass } from "lucide-react"

export default function DashboardLoading() {
  return (
    <main className="max-w-5xl mx-auto py-6 sm:py-10 px-4 md:px-6">
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-2">
          <div className="animate-pulse">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                <Compass className="w-4 h-4 text-zinc-600" />
              </div>
              <div className="h-8 w-48 bg-zinc-800 rounded-md" />
            </div>
            <div className="h-4 w-64 sm:w-96 bg-zinc-800/50 rounded ml-10 mt-2" />
          </div>
          
          {/* Mock SearchBar Skeleton */}
          <div className="w-full sm:w-64 h-10 bg-zinc-800/50 rounded-xl animate-pulse" />
        </div>
      </div>
      
      {/* Mock Feed Container */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Main Feed Content */}
        <div className="flex-1 w-full space-y-6">
          {/* Controls Skeleton */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-2">
              <div className="w-24 h-9 bg-zinc-800/50 rounded-lg animate-pulse" />
              <div className="w-24 h-9 bg-zinc-800/50 rounded-lg animate-pulse" />
            </div>
          </div>
          
          {/* Idea Cards Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5 sm:p-6 animate-pulse">
                <div className="flex gap-4 sm:gap-5 items-start">
                  <div className="w-11 h-14 bg-zinc-800/50 rounded-xl shrink-0" />
                  <div className="flex-1 min-w-0 space-y-3 pt-1">
                    <div className="h-6 w-3/4 bg-zinc-800/80 rounded" />
                    <div className="h-4 w-full bg-zinc-800/50 rounded" />
                    <div className="h-4 w-5/6 bg-zinc-800/50 rounded" />
                    <div className="flex gap-2 mt-4">
                      <div className="w-16 h-5 bg-zinc-800/50 rounded-lg" />
                      <div className="w-20 h-5 bg-zinc-800/50 rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="w-full md:w-64 lg:w-72 shrink-0 space-y-8 animate-pulse">
          <div className="space-y-3">
            <div className="h-5 w-32 bg-zinc-800/80 rounded mb-4" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-full bg-zinc-800/50 rounded-lg" />
            ))}
          </div>
          <div className="space-y-3">
            <div className="h-5 w-32 bg-zinc-800/80 rounded mb-4" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-full bg-zinc-800/50 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
