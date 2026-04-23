"use client"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';
import { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, ShieldAlert, TrendingUp } from "lucide-react"

export function TrendsDashboard({ domainData, stackData, difficultyData, clusterData = [], fragileDeps = [] }: { domainData: any[], stackData: any[], difficultyData: any[], clusterData?: any[], fragileDeps?: any[] }) {
  const COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#a855f7', '#ec4899'];
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
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-950/95 border border-zinc-700 p-4 rounded-xl shadow-2xl backdrop-blur-sm max-w-xs">
          <p className="text-white font-bold mb-1 leading-tight">{data.summary}</p>
          <p className="text-indigo-400 text-xs font-semibold">{data.size} developers requested this</p>
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
        <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          The Market Galaxy
        </h3>
        <p className="text-sm text-zinc-500 mb-6 relative z-10 ml-10">Larger, brighter clusters = higher market demand via K-Means AI pipeline.</p>
        
        <div className="h-96 w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <XAxis type="number" dataKey="x" hide domain={['auto', 'auto']} />
              <YAxis type="number" dataKey="y" hide domain={['auto', 'auto']} />
              <ZAxis type="number" dataKey="size" range={[100, 2000]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
              <Scatter name="Clusters" data={clusterData} fill="#8b5cf6">
                {clusterData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Difficulty Donut */}
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm md:col-span-2 flex flex-col items-center">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 self-start w-full flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-500" /> Problem Difficulty Distribution
        </h3>
        <div className="h-64 w-full max-w-[400px] flex justify-center">
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
                {difficultyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={ChartTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-6 mt-4">
           {difficultyData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
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

      {/* Domains */}
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm md:col-span-1">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Top Problem Domains</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={domainData} layout="vertical" margin={{ left: 40 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#8b5cf6', fontSize: 12, fontWeight: 600}} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={ChartTooltipStyle} />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stacks */}
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm md:col-span-2">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Most Recommended Tech Stacks</h3>
        <div className="h-72 w-full">
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