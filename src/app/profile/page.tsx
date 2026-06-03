import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { updateProfile } from "@/actions/profile"
import { Code, Link2, Save, Globe, Calendar, ChevronUp, Bookmark, MessageSquare, GitBranch, Lightbulb } from "lucide-react"
import { SubmitButton } from "@/components/SubmitButton"
import { ProfileTabs } from "./ProfileTabs"
import Image from "next/image"

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/dashboard?login=true');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      savedIdeas: { 
        include: { 
          idea: { 
            include: { 
              tags: { include: { tag: true } }, 
              repositories: true, 
              savedBy: true, 
              author: true, 
              upvotes: true, 
              waitlist: true, 
              _count: { select: { upvotes: true, comments: true } } 
            } 
          } 
        } 
      },
      repositories: { include: { idea: true, user: true } },
      submittedIdeas: { 
        include: { 
          tags: { include: { tag: true } }, 
          repositories: true, 
          savedBy: true, 
          author: true, 
          upvotes: true, 
          waitlist: true, 
          _count: { select: { upvotes: true, comments: true } } 
        } 
      }
    }
  });

  if (!user) {
    console.error("User not found in database:", session.user.id);
    redirect('/');
  }

  // Compute stats
  const [upvotesReceived, commentsMade] = await Promise.all([
    prisma.upvote.count({ where: { idea: { authorId: session.user.id } } }),
    prisma.comment.count({ where: { userId: session.user.id } }),
  ]);

  const stats = [
    { label: "Ideas Submitted", value: user.submittedIdeas.length, icon: Lightbulb },
    { label: "Upvotes Received", value: upvotesReceived, icon: ChevronUp },
    { label: "Comments Made", value: commentsMade, icon: MessageSquare },
    { label: "Repos Linked", value: user.repositories.length, icon: GitBranch },
    { label: "Ideas Saved", value: user.savedIdeas.length, icon: Bookmark },
  ];

  // Calculate Dev Karma (Gamified metrics)
  const devKarma = (user.submittedIdeas.length * 10) + (upvotesReceived * 5) + (commentsMade * 2) + (user.repositories.length * 15);

  // Pure date calculations computed during component execution rather than in render nodes
  const verifiedDate = user.emailVerified ?? new Date();
  const cakeDayStr = verifiedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const cakeAgeDays = Math.max(1, Math.floor((new Date().getTime() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <main className="max-w-6xl mx-auto py-8 sm:py-14 px-4 text-zinc-900 dark:text-white">
      
      {/* 1. Stunning Asymmetric Developer Hero Header */}
      <div className="relative w-full rounded-3xl overflow-hidden mb-10 bg-zinc-950/40 border border-zinc-200/10 dark:border-white/5 p-6 sm:p-8 md:p-10 shadow-lg">
        {/* Soft, premium mesh gradient highlight */}
        <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.3) 0%, transparent 50%), radial-gradient(circle at 90% 80%, rgba(139, 92, 246, 0.2) 0%, transparent 50%)` }}></div>
        {/* Tech Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808007_1px,transparent_1px),linear-gradient(to_bottom,#80808007_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 w-full">
          {/* Avatar Area */}
          <div className="relative shrink-0 group">
            {user.image ? (
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-accent/20 shadow-xl shrink-0 bg-zinc-900">
                <Image src={user.image} alt="Profile" fill sizes="(max-width: 640px) 96px, 112px" className="object-cover" priority />
              </div>
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-accent flex items-center justify-center text-4xl font-black text-white border-2 border-accent/20 shadow-xl shrink-0">
                {user.name?.charAt(0) || 'D'}
              </div>
            )}
            
            {/* Status indicator pill */}
            {user.currentStreak > 0 && (
              <span className="absolute -bottom-2 -right-2 bg-zinc-950 border border-amber-500/30 text-amber-500 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-md flex items-center gap-1 select-none">
                🔥 {user.currentStreak}
              </span>
            )}
          </div>

          {/* User Meta Information Area */}
          <div className="flex-1 text-center md:text-left min-w-0">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white truncate">
                {user.name || 'Developer'}
              </h1>
              
              {user.reputationScore > 0 && (
                <span className="inline-flex items-center gap-1 bg-accent/10 text-accent dark:text-accent-text px-2.5 py-0.5 rounded-lg font-bold text-[9px] uppercase tracking-widest border border-accent/15">
                  ⭐ Rank {user.reputationScore}
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono mt-1 select-all">
              @/{user.email.split('@')[0]}
            </p>

            {user.bio ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-4 italic leading-relaxed max-w-2xl font-medium">
                &ldquo;{user.bio}&rdquo;
              </p>
            ) : (
              <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-4 italic max-w-2xl">
                No developer bio added yet. Fill in your headline in the Edit Profile tab.
              </p>
            )}

            {/* Paradise Member Status */}
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-4 gap-y-2 mt-4 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>Paradise Member Since: <strong>{cakeDayStr}</strong></span>
              </div>
              <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />
              <div>
                <span>Account Age: <strong>{cakeAgeDays} Days</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Stunning High-Impact Statistics Dashboard Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-10">
        {[
          { label: "Submitted Complaints", value: user.submittedIdeas.length, icon: Lightbulb, color: "from-accent to-indigo-500" },
          { label: "Upvotes Received", value: upvotesReceived, icon: ChevronUp, color: "from-purple-500 to-pink-500" },
          { label: "Comments Contributed", value: commentsMade, icon: MessageSquare, color: "from-emerald-500 to-teal-500" },
          { label: "Linked Solutions", value: user.repositories.length, icon: GitBranch, color: "from-blue-500 to-cyan-500" },
          { label: "Impact Index", value: devKarma, icon: Bookmark, color: "from-amber-500 to-orange-500" },
        ].map((item, idx) => (
          <div 
            key={item.label} 
            className="relative overflow-hidden bg-white dark:bg-zinc-900/40 p-5 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm hover:border-accent/15 transition-all duration-300 group text-left"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.04),transparent_70%)] pointer-events-none" />
            <div className="text-zinc-400 dark:text-zinc-500 text-[9px] uppercase tracking-wider font-bold mb-2.5 flex items-center gap-1.5">
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-zinc-900 dark:text-zinc-50">
              {item.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Horizontal Grid Layout for Content & Links */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Social Links & Edit Profile (4 columns wide on desktop) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-zinc-900/40 rounded-2xl border border-zinc-200 dark:border-white/5 p-5 shadow-sm flex flex-col gap-4 text-left">
            <h3 className="text-xs uppercase font-extrabold tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">Developer Directory</h3>
            
            <div className="flex flex-col gap-2.5">
              {user.githubUrl && (
                <a href={user.githubUrl} target="_blank" className="flex items-center justify-between p-3 text-xs bg-zinc-50 dark:bg-zinc-950/40 hover:bg-zinc-100 dark:hover:bg-white/[0.04] border border-zinc-100 dark:border-white/5 rounded-xl text-zinc-600 dark:text-zinc-300 transition-colors">
                  <span className="flex items-center gap-2 font-bold">
                    <Code className="w-4 h-4 text-zinc-400 shrink-0" /> GitHub Profile
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[150px]">@{user.githubUrl.split('/').pop()}</span>
                </a>
              )}
              {user.twitterUrl && (
                <a href={user.twitterUrl} target="_blank" className="flex items-center justify-between p-3 text-xs bg-zinc-50 dark:bg-zinc-950/40 hover:bg-zinc-100 dark:hover:bg-white/[0.04] border border-zinc-100 dark:border-white/5 rounded-xl text-zinc-600 dark:text-zinc-300 transition-colors">
                  <span className="flex items-center gap-2 font-bold">
                    <Link2 className="w-4 h-4 text-zinc-400 shrink-0" /> Twitter Handle
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[150px]">@{user.twitterUrl.split('/').pop()}</span>
                </a>
              )}
              {user.websiteUrl && (
                <a href={user.websiteUrl} target="_blank" className="flex items-center justify-between p-3 text-xs bg-zinc-50 dark:bg-zinc-950/40 hover:bg-zinc-100 dark:hover:bg-white/[0.04] border border-zinc-100 dark:border-white/5 rounded-xl text-zinc-600 dark:text-zinc-300 transition-colors">
                  <span className="flex items-center gap-2 font-bold">
                    <Globe className="w-4 h-4 text-zinc-400 shrink-0" /> Personal Site
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[150px]">{user.websiteUrl.replace(/https?:\/\/(www\.)?/, '')}</span>
                </a>
              )}
              {user.linkedinUrl && (
                <a href={user.linkedinUrl} target="_blank" className="flex items-center justify-between p-3 text-xs bg-zinc-50 dark:bg-zinc-950/40 hover:bg-zinc-100 dark:hover:bg-white/[0.04] border border-zinc-100 dark:border-white/5 rounded-xl text-zinc-600 dark:text-zinc-300 transition-colors">
                  <span className="flex items-center gap-2 font-bold">
                    <Link2 className="w-4 h-4 text-zinc-400 shrink-0" /> LinkedIn Directory
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[150px]">@{user.linkedinUrl.split('/').pop()}</span>
                </a>
              )}
              {!user.githubUrl && !user.twitterUrl && !user.websiteUrl && !user.linkedinUrl && (
                <div className="text-center py-6 text-xs text-zinc-400 dark:text-zinc-500 border border-dashed border-zinc-200 dark:border-white/10 rounded-xl">
                  No verified developer accounts linked.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed feeds and dynamic workspace (8 columns wide on desktop) */}
        <div className="lg:col-span-8 space-y-6">
          <ProfileTabs
            editForm={
              <form action={updateProfile} className="bg-white dark:bg-zinc-900/40 p-6 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm flex flex-col gap-4 text-left">
                 <div className="border-b border-zinc-100 dark:border-white/5 pb-3">
                   <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Edit Profile Details</h3>
                   <p className="text-xs text-zinc-500 mt-0.5">Customize how other developers see you in the network.</p>
                 </div>
                 
                 <div>
                   <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">Bio / Headline</label>
                   <textarea 
                     name="bio" 
                     rows={3}
                     defaultValue={user.bio || ''} 
                     placeholder="Bio / Headline... Briefly tell developers what you are working on." 
                     className="w-full bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all outline-none resize-none" 
                   />
                 </div>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
                   <div>
                     <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">GitHub URL</label>
                     <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent transition-all">
                       <Code className="w-4 h-4 text-zinc-400 shrink-0" />
                       <input name="githubUrl" type="url" defaultValue={user.githubUrl || ''} placeholder="https://github.com/you" className="w-full bg-transparent border-none text-sm text-zinc-900 dark:text-white outline-none p-0 focus:ring-0" />
                     </div>
                   </div>
                   
                   <div>
                     <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">Twitter URL</label>
                     <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent transition-all">
                       <Link2 className="w-4 h-4 text-zinc-400 shrink-0" />
                       <input name="twitterUrl" type="url" defaultValue={user.twitterUrl || ''} placeholder="https://twitter.com/you" className="w-full bg-transparent border-none text-sm text-zinc-900 dark:text-white outline-none p-0 focus:ring-0" />
                     </div>
                   </div>
                   
                   <div>
                     <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">Website URL</label>
                     <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent transition-all">
                       <Globe className="w-4 h-4 text-zinc-400 shrink-0" />
                       <input name="websiteUrl" type="url" defaultValue={user.websiteUrl || ''} placeholder="https://yoursite.com" className="w-full bg-transparent border-none text-sm text-zinc-900 dark:text-white outline-none p-0 focus:ring-0" />
                     </div>
                   </div>
                   
                   <div>
                     <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">LinkedIn URL</label>
                     <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent transition-all">
                       <Link2 className="w-4 h-4 text-zinc-400 shrink-0" />
                       <input name="linkedinUrl" type="url" defaultValue={user.linkedinUrl || ''} placeholder="https://linkedin.com/in/you" className="w-full bg-transparent border-none text-sm text-zinc-900 dark:text-white outline-none p-0 focus:ring-0" />
                     </div>
                   </div>
                 </div>
                 
                 <SubmitButton className="w-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-bold py-2.5 rounded-xl text-sm transition-colors shadow-sm mt-3" loadingText="Saving Details...">
                   <Save className="w-4 h-4" /> Save Profile Details
                 </SubmitButton>
              </form>
            }
            submittedIdeas={user.submittedIdeas}
            savedIdeas={user.savedIdeas.map(s => s.idea)}
            repositories={user.repositories}
          />
        </div>

      </div>
    </main>
  );
}
