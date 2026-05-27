/* eslint-disable react-hooks/set-state-in-effect */
"use client"
import { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, ShieldAlert, Target, Flame, Code2, Rocket, ArrowRight, ArrowUpRight, CheckCircle2, Activity, Zap, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

// PMF Heatmap: 0 = cool blue, 50 = amber, 100 = hot red
function getPMFColor(score: number): string {
  const clamped = Math.max(0, Math.min(100, score || 0));
  if (clamped < 50) {
    const t = clamped / 50;
    const r = Math.round(59 + t * (245 - 59));
    const g = Math.round(130 + t * (158 - 130));
    const b = Math.round(246 + t * (11 - 246));
    return `rgb(${r},${g},${b})`;
  } else {
    const t = (clamped - 50) / 50;
    const r = Math.round(245 + t * (239 - 245));
    const g = Math.round(158 + t * (68 - 158));
    const b = Math.round(11 + t * (68 - 11));
    return `rgb(${r},${g},${b})`;
  }
}

function getClusterName(cluster: { summary?: string, ideas?: { domain?: string, title: string }[] }, index: number): string {
  const summary = cluster?.summary;
  const isGeneric = !summary || summary.trim().toLowerCase() === "developer pain points";
  if (!isGeneric) return summary as string;
  
  if (cluster?.ideas && cluster.ideas.length > 0) {
    const firstIdea = cluster.ideas[0];
    if (firstIdea.domain) {
      return `${firstIdea.domain} Issues`;
    }
    const words = firstIdea.title.split(' ').slice(0, 4).join(' ');
    return `${words}...`;
  }
  return `Market Segment #${index + 1}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TrendsDashboard({ domainData, stackData, difficultyData, clusterData = [], fragileDeps = [] }: { domainData: { name: string; count: number }[], stackData: { name: string; count: number }[], difficultyData: { name: string; count: number }[], clusterData?: { id: string; summary: string; size: number; x: number; y: number; pmfScore?: number | null; ideas?: any[] }[], fragileDeps?: { id: string; name: string; ecosystem: string; complaintCount: number }[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-zinc-500 gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-sm font-medium">Crunching market data...</span>
      </div>
    );
  }
  
  // Calculate max values for thresholds
  const maxDomainCount = Math.max(...domainData.map(d => d.count), 1);
  
  const featuredCluster = clusterData[0];
  const indexClusters = clusterData.slice(1, 6);

  return (
    <div className="flex flex-col gap-10">
      
      {/* SECTION 1: SaaS Opportunity Index */}
      <div>
        <div className="mb-6">
           <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
               <Target className="w-4 h-4 text-white" />
             </div>
             SaaS Opportunity Index
           </h3>
           <p className="text-sm text-zinc-500 dark:text-zinc-400 ml-10">
             Ranked target markets based on high Product-Market Fit validation scores and absolute complaint volume.
           </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          
          {/* Featured Market Deep Dive */}
          {featuredCluster ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-950 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl shadow-indigo-500/5 relative overflow-hidden flex flex-col"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/50 via-transparent to-transparent dark:from-indigo-500/10 dark:via-transparent dark:to-transparent pointer-events-none" />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/30 flex items-center gap-1.5">
                    <Flame className="w-3 h-3" /> #1 Featured Market
                  </span>
                </div>
                
                <h4 className="text-2xl font-bold text-zinc-900 dark:text-white leading-tight mb-6">
                  {getClusterName(featuredCluster, 0)}
                </h4>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block mb-1">Validation (PMF)</span>
                    <span className="text-3xl font-black" style={{ color: getPMFColor(featuredCluster.pmfScore || 0) }}>
                      {Math.round(featuredCluster.pmfScore || 0)}<span className="text-lg text-zinc-400 font-medium">/100</span>
                    </span>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block mb-1">Market Volume</span>
                    <span className="text-3xl font-black text-zinc-900 dark:text-white">
                      {featuredCluster.size}<span className="text-lg text-zinc-400 font-medium"> signals</span>
                    </span>
                  </div>
                </div>

                <div className="flex-1">
                  <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-500" /> Core Pain Points
                  </h5>
                  <ul className="space-y-3">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {featuredCluster.ideas?.map((idea: any) => (
                      <li key={idea.id} className="flex items-start gap-2.5 text-sm text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <ArrowUpRight className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{idea.title}</span>
                      </li>
                    ))}
                    {!featuredCluster.ideas?.length && (
                      <li className="text-sm text-zinc-500 italic">No specific complaints extracted yet.</li>
                    )}
                  </ul>
                </div>

                <Link 
                  href={`/dashboard?q=${encodeURIComponent(getClusterName(featuredCluster, 0))}`} 
                  className="mt-8 w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg"
                >
                  Explore Market Feed <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ) : (
            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center min-h-[400px]">
              <span className="text-zinc-500">Not enough data to calculate featured market.</span>
            </div>
          )}

          {/* The Index Leaderboard */}
          <div className="flex flex-col bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-zinc-500" /> The Index (Top 2-6)
            </h4>
            
            <div className="flex flex-col gap-4">
              {indexClusters.map((cluster, i) => (
                <Link 
                  href={`/dashboard?q=${encodeURIComponent(getClusterName(cluster, i + 1))}`}
                  key={cluster.id}
                  className="group flex flex-col p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all hover:shadow-md cursor-pointer relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors pr-4 leading-tight">
                      {getClusterName(cluster, i + 1)}
                    </h5>
                    <div className="shrink-0 flex items-center gap-1.5 bg-white dark:bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">PMF</span>
                      <span className="text-xs font-black" style={{ color: getPMFColor(cluster.pmfScore || 0) }}>
                        {Math.round(cluster.pmfScore || 0)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-3">
                    <span className="flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5" /> {cluster.size} signals
                    </span>
                  </div>

                  <div className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-1 pl-3 border-l-2 border-indigo-200 dark:border-indigo-900/50">
                    {cluster.ideas && cluster.ideas.length > 0 ? cluster.ideas[0].title : 'Exploring market potential...'}
                  </div>
                </Link>
              ))}
              {indexClusters.length === 0 && (
                <div className="text-sm text-zinc-500 italic text-center py-8">
                  Collecting more market data...
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        
        {/* SECTION 2: Domain Urgency Grid */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col">
           <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1 flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
               <AlertTriangle className="w-4 h-4 text-white" />
             </div>
             Domain Urgency Grid
           </h3>
           <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 ml-10">
             Where the market is bleeding the most. High-friction domains.
           </p>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {domainData.map((domain, i) => {
                const isExtreme = domain.count >= maxDomainCount * 0.8;
                const isHigh = domain.count >= maxDomainCount * 0.4 && !isExtreme;
                
                return (
                  <motion.div 
                    key={domain.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex flex-col p-4 rounded-2xl border ${isExtreme ? 'bg-rose-50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-900/30' : isHigh ? 'bg-orange-50 dark:bg-orange-500/5 border-orange-200 dark:border-orange-900/30' : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800'}`}
                  >
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2 truncate" title={domain.name}>{domain.name}</span>
                    <div className="flex items-center justify-between mt-auto">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${isExtreme ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' : isHigh ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                        {isExtreme ? '🔥 Extreme' : isHigh ? '🟠 High' : '🟡 Moderate'}
                      </span>
                      <span className="text-xs font-bold text-zinc-500">{domain.count} issues</span>
                    </div>
                  </motion.div>
                )
              })}
           </div>
        </div>

        {/* SECTION 3: The Blueprint (Ecosystem Gaps) */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col">
           <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1 flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
               <Code2 className="w-4 h-4 text-white" />
             </div>
             Ecosystem Gaps
           </h3>
           <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 ml-10">
             Tech stacks where developers are actively begging for solutions.
           </p>

           <div className="flex flex-wrap gap-2 sm:gap-3">
              {stackData.map((stack, i) => (
                <motion.div 
                  key={stack.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 grow"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{stack.name}</span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Unsolved Gaps</span>
                  </div>
                  <div className="ml-auto shrink-0 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-cyan-600 dark:text-cyan-400 font-black text-sm px-3 py-1 rounded-lg shadow-sm">
                    {stack.count}
                  </div>
                </motion.div>
              ))}
              {stackData.length === 0 && (
                <div className="text-sm text-zinc-500 text-center py-4 w-full">No tech stack data available.</div>
              )}
           </div>
        </div>

      </div>

      {/* SECTION 4: Disruption Targets */}
      <div className="bg-zinc-900 dark:bg-zinc-950 border border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-20">
           <Zap className="w-64 h-64 text-red-500" />
         </div>
         
         <div className="relative z-10">
           <h3 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shadow-lg shadow-red-500/20">
               <ShieldAlert className="w-5 h-5 text-red-500" />
             </div>
             Disruption Targets
           </h3>
           <p className="text-sm text-zinc-400 mb-8 ml-13">
             The Hit List: Failing open-source tools and dependencies. Build modern, stable alternatives.
           </p>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {fragileDeps.map((dep, i) => (
                <motion.div 
                  key={dep.id} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col bg-zinc-950/80 p-5 rounded-2xl border border-red-500/20 hover:border-red-500/50 transition-colors shadow-lg"
                >
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        <div>
                          <p className="text-base font-bold text-white leading-none mb-1">{dep.name}</p>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{dep.ecosystem}</p>
                        </div>
                      </div>
                   </div>
                   
                   <p className="text-xs text-zinc-400 mb-5 leading-relaxed bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                     <span className="text-red-400 font-bold">{dep.complaintCount} incident reports</span> indicate a high potential for a stable, drop-in replacement in the {dep.ecosystem} ecosystem.
                   </p>
                   
                   <Link href={`/dashboard?q=${encodeURIComponent(dep.name)}`} className="mt-auto inline-flex items-center justify-center gap-2 text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-700 transition-colors uppercase tracking-wider rounded-xl py-2.5 px-4 w-full">
                     View Incident Reports <ArrowRight className="w-3.5 h-3.5" />
                   </Link>
                </motion.div>
              ))}
              {fragileDeps.length === 0 && (
                 <div className="col-span-full text-sm text-zinc-500 text-center py-12 border border-dashed border-zinc-800 rounded-2xl">
                   No disruption targets detected yet.
                 </div>
              )}
           </div>
         </div>
      </div>

    </div>
  );
}