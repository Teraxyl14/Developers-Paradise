"use client"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useState, useEffect } from 'react';

export function TrendsDashboard({ domainData, stackData, difficultyData }: { domainData: any[], stackData: any[], difficultyData: any[] }) {
  const COLORS = ['#3b82f6', '#8b5cf6', '#6366f1', '#a855f7', '#ec4899'];
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-[50vh] flex items-center justify-center text-zinc-500">Loading metrics...</div>;
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Top Problem Domains</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={domainData} layout="vertical" margin={{ left: 40 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#8b5cf6', fontSize: 12}} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff'}} />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Most Recommended Tech Stacks</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stackData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#8b5cf6', fontSize: 12}} />
              <YAxis hide />
              <Tooltip cursor={{fill: '#27272a', opacity: 0.1}} contentStyle={{backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff'}} />
              <Bar dataKey="count" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 rounded-xl p-6 shadow-sm md:col-span-2 flex flex-col items-center">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 self-start w-full">Problem Difficulty Distribution</h3>
        <div className="h-64 w-full max-w-[400px] flex justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={difficultyData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
              >
                {difficultyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff'}} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-6 mt-4">
           {difficultyData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-sm text-zinc-400">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                {d.name}
              </div>
           ))}
        </div>
      </div>
    </div>
  );
}