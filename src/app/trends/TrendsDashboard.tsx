"use client"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, LabelList } from 'recharts';
import { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, ShieldAlert, TrendingUp, Info } from "lucide-react"

// Distinct color palettes for each chart type
const DIFFICULTY_COLORS: Record<string, string> = {
  'Beginner': '#22c55e',
  'Intermediate': '#f59e0b',
  'Advanced': '#ef4444',
};

const DOMAIN_COLORS = ['#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63', '#134e4a', '#115e59', '#0d9488', '#14b8a6', '#2dd4bf'];

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

export function TrendsDashboard({ domainData, stackData, difficultyData, clusterData = [], fragileDeps = [] }: { domainData: any[], stackData: any[], difficultyData: any[], clusterData?: any[], fragileDeps?: any[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-zinc-500 gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-sm">Loading metrics...</span>
      </div>
    );
  }
  
  const GalaxyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-950/95 border border-zinc-700 p-4 rounded-xl shadow-2xl backdrop-blur-sm max-w-xs">
          <p className="text-white font-bold mb-1 leading-tight">{data.summary}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-indigo-400 text-xs font-semibold">{data.size} ideas in cluster</span>
            {data.pmfScore != null && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: getPMFColor(data.pmfScore), color: data.pmfScore > 60 ? '#fff' : '#18181b' }}>
                PMF: {Math.round(data.pmfScore)}
              </span>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const ChartTooltipStyle = {
    backgroundColor: 'rgba(9,9,11,0.95)', 
    border: '1px solid rgba(255,255,255,0.1)', 
    borderRadius: '12px', 
    color: '#fff',
    padding: '8px 12px',
    fontSize: '12px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* Market Galaxy */}
      <div className="bg-zinc-950 border border-zinc-800 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm md:col-span-3 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-zinc-950 to-zinc-950 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4 relative z-10">
          <div>
            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              The Market Galaxy
            </h3>
            <p className="text-sm text-zinc-500 ml-10">AI-clustered developer complaints mapped by market demand.</p>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-2 text-xs text-zinc-400 bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 min-w-[200px]">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-zinc-600 border border-zinc-500" />
              <span>Bubble size = cluster size (# of ideas)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1.5 rounded-full bg-gradient-to-r from-blue-400 via-amber-400 to-red-500" />
              <span>Color = PMF score (cool → hot)</span>
            </div>
          </div>
        </div>

        {/* Info callout */}
        <div className="flex items-start gap-2 bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-3 mb-4 relative z-10">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-300/80">Each bubble represents a cluster of similar developer complaints. Larger, hotter bubbles indicate higher validated market demand. Hover to see details.</p>
        </div>
        
        <div className="h-96 w-full min-w-0 relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <XAxis type="number" dataKey="x" hide domain={['auto', 'auto']} />
              <YAxis type="number" dataKey="y" hide domain={['auto', 'auto']} />
              <ZAxis type="number" dataKey="size" range={[150, 2500]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<GalaxyTooltip />} />
              <Scatter name="Clusters" data={clusterData} fill="#8b5cf6">
                {clusterData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getPMFColor(entry.pmfScore || 0)} fillOpacity={0.85} stroke={getPMFColor(entry.pmfScore || 0)} strokeWidth={1} />
                ))}
                <LabelList dataKey="summary" position="top" style={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 600 }} />
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* PMF Heatmap scale */}
        <div className="flex items-center gap-3 mt-4 relative z-10 justify-center">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Low PMF</span>
          <div className="w-48 h-2.5 rounded-full bg-gradient-to-r from-blue-400 via-amber-400 to-red-500 shadow-inner" />
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">High PMF</span>
        </div>
      </div>

      {/* Difficulty Donut — Semantic colors */}
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm md:col-span-2 flex flex-col items-center">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 self-start w-full flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-500" /> Difficulty Distribution
        </h3>
        <div className="h-64 w-full min-w-0 max-w-[400px] flex justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={difficultyData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="count"
                stroke="none"
              >
                {difficultyData.map((entry) => (
                  <Cell key={entry.name} fill={DIFFICULTY_COLORS[entry.name] || '#6366f1'} />
                ))}
              </Pie>
              <Tooltip contentStyle={ChartTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-6 mt-4">
           {difficultyData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: DIFFICULTY_COLORS[d.name] || '#6366f1' }}></span>
                {d.name}
              </div>
           ))}
        </div>
      </div>

      {/* Fragile Dependencies */}
      <div className="bg-red-50/50 dark:bg-red-500/5 border border-red-200/80 dark:border-red-500/15 rounded-2xl p-6 shadow-sm md:col-span-1">
        <h3 className="text-lg font-bold text-red-900 dark:text-red-400 mb-1 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
            <ShieldAlert className="w-4 h-4 text-white" />
          </div>
          Fragile Deps
        </h3>
        <p className="text-xs text-red-700/80 dark:text-red-400/60 mb-5 ml-10">Highest failure rates reported globally.</p>
        <div className="space-y-2.5">
          {fragileDeps.map((dep, i) => (
            <div key={dep.id} className="flex items-center justify-between bg-white dark:bg-zinc-950/80 p-3 rounded-xl border border-red-100 dark:border-red-500/10 hover:border-red-200 dark:hover:border-red-500/20 transition-colors">
               <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-red-100 dark:bg-red-500/15 flex items-center justify-center text-xs font-bold text-red-600 dark:text-red-400">
                     {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{dep.name}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{dep.ecosystem}</p>
                  </div>
               </div>
               <span className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {dep.complaintCount}
               </span>
            </div>
          ))}
          {fragileDeps.length === 0 && (
             <p className="text-sm text-zinc-500 text-center py-4">No fragile dependencies detected.</p>
          )}
        </div>
      </div>

      {/* Domains — Teal color palette */}
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm md:col-span-1">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Top Domains</h3>
        <div className="h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={domainData} layout="vertical" margin={{ left: 40 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#0891b2', fontSize: 12, fontWeight: 600}} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={ChartTooltipStyle} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
                {domainData.map((_, index) => (
                  <Cell key={`domain-${index}`} fill={DOMAIN_COLORS[index % DOMAIN_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stacks — Purple gradient (kept distinct) */}
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm md:col-span-2">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Most Recommended Tech Stacks</h3>
        <div className="h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stackData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#8b5cf6', fontSize: 11, fontWeight: 600}} />
              <YAxis hide />
              <Tooltip cursor={{fill: '#27272a', opacity: 0.1}} contentStyle={ChartTooltipStyle} />
              <Bar dataKey="count" fill="url(#stackGradient)" radius={[6, 6, 0, 0]} barSize={36} />
              <defs>
                <linearGradient id="stackGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}