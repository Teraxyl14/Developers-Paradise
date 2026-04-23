"use client"
import { useState, useTransition } from "react"
import { generateMarketAnalysis } from "@/actions/analysis"
import { Bot, ShieldAlert, Zap, Search, ExternalLink, Target } from "lucide-react"

export function MarketIntelligence({ ideaId, initialAnalysis }: { ideaId: string, initialAnalysis?: any }) {
  const [analysis, setAnalysis] = useState<any>(initialAnalysis);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleGenerate = () => {
    startTransition(async () => {
      setError(null);
      try {
        const result = await generateMarketAnalysis(ideaId);
        setAnalysis(result);
      } catch (e: any) {
        setError(e.message || "Failed to generate analysis");
      }
    });
  };

  if (!analysis && !isPending) {
    return (
      <div className="bg-blue-50/50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 rounded-xl p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
         <div>
            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5 mb-1">
              <Bot className="w-4 h-4" /> AI Market Analysis
            </h4>
            <p className="text-xs text-blue-700/80 dark:text-blue-400/80">Use Gemini to scour the web for existing competitors and market gaps before you start building.</p>
         </div>
         <div className="flex items-center gap-3">
             {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
             <button 
               onClick={handleGenerate} 
               className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
             >
               Analyze Market
             </button>
         </div>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 rounded-xl p-8 mb-6 flex flex-col items-center justify-center text-center">
         <div className="relative mb-4">
            <Search className="w-8 h-8 text-blue-500 animate-pulse" />
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
         </div>
         <p className="text-sm font-semibold text-zinc-900 dark:text-white">Gemini is researching the web...</p>
         <p className="text-xs text-zinc-500 mt-1">Analyzing competitors and calculating market saturation.</p>
      </div>
    );
  }

  const getScoreBadge = (score: string) => {
    switch (score?.toLowerCase()) {
      case 'low': return <span className="px-2.5 py-1 rounded-md bg-green-50 text-green-700 border border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20 text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Low Saturation</span>;
      case 'high': return <span className="px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 text-xs font-bold uppercase tracking-wider flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> High Saturation</span>;
      default: return <span className="px-2.5 py-1 rounded-md bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-500 dark:border-yellow-500/20 text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Medium Saturation</span>;
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/10 rounded-xl overflow-hidden mb-8 shadow-sm">
       <div className="px-5 py-4 border-b border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/80 flex justify-between items-center">
          <h4 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Bot className="w-4 h-4 text-blue-500" /> Market Intelligence
          </h4>
          {getScoreBadge(analysis.saturationScore)}
       </div>
       <div className="p-5 space-y-6">
          <div>
             <h5 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">AI Verdict</h5>
             <p className="text-sm text-zinc-800 dark:text-zinc-300 leading-relaxed border-l-2 border-blue-500 pl-3 italic bg-blue-50/50 dark:bg-blue-500/5 py-2 pr-3 rounded-r-md">
                {analysis.verdict}
             </p>
          </div>

          {analysis.wedgeStrategy && analysis.wedgeStrategy.length > 0 && (
             <div>
                <h5 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-orange-500" /> The Wedge Strategy</h5>
                <div className="bg-orange-50/50 dark:bg-orange-500/5 border border-orange-200/50 dark:border-orange-500/20 rounded-lg p-4">
                   <p className="text-xs text-orange-800 dark:text-orange-300 mb-3 font-medium">To compete with existing giants as a solo developer, ignore their core features and exclusively build these 3 hyper-niche wedges first:</p>
                   <ul className="space-y-2">
                      {analysis.wedgeStrategy.map((wedge: string, i: number) => (
                         <li key={i} className="text-sm text-zinc-800 dark:text-zinc-300 flex items-start gap-2">
                            <span className="shrink-0 w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-bold">{i+1}</span>
                            <span className="pt-0.5">{wedge}</span>
                         </li>
                      ))}
                   </ul>
                </div>
             </div>
          )}

          <div>
             <h5 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Identified Competitors</h5>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analysis.competitors?.map((comp: any, i: number) => (
                   <div key={i} className="bg-zinc-50 dark:bg-zinc-950/50 p-3.5 rounded-lg border border-zinc-100 dark:border-white/5">
                      <div className="flex items-center gap-2 mb-1.5">
                         <span className="font-semibold text-sm text-zinc-900 dark:text-white">{comp.name}</span>
                         {comp.url && comp.url !== 'Unknown' && (
                            <a href={comp.url} target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
                               <ExternalLink className="w-3 h-3" />
                            </a>
                         )}
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-3" title={comp.shortcoming}><strong className="text-zinc-500 dark:text-zinc-500">Shortcoming:</strong> {comp.shortcoming}</p>
                   </div>
                ))}
                {(!analysis.competitors || analysis.competitors.length === 0) && (
                   <p className="text-sm text-zinc-500">No direct competitors found.</p>
                )}
             </div>
          </div>
       </div>
    </div>
  )
}
