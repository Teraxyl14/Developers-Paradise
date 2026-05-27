import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { updateProfile } from "@/actions/profile"
import { Code, Link2, Save, Globe, Calendar, ChevronUp, Bookmark, MessageSquare, GitBranch, Lightbulb } from "lucide-react"
import { SubmitButton } from "@/components/SubmitButton"
import { ProfileTabs } from "./ProfileTabs"

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/api/auth/signin');

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
    <main className="max-w-6xl mx-auto py-6 sm:py-10 px-4 text-zinc-900 dark:text-white">
      {/* 1. Reddit-Style Custom Tech Banner */}
      <div className="relative h-36 md:h-48 w-full rounded-2xl overflow-hidden mb-8 bg-zinc-900 border border-zinc-200/10 dark:border-white/5">
        {/* Dynamic mesh gradients */}
        <div className="absolute inset-0 opacity-40 mix-blend-overlay" style={{ backgroundImage: `radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.4) 0%, transparent 60%), radial-gradient(circle at 85% 30%, rgba(236, 72, 153, 0.3) 0%, transparent 60%), radial-gradient(circle at 50% 80%, rgba(139, 92, 246, 0.25) 0%, transparent 50%)` }}></div>
        {/* Tech Grid Pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:16px_16px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)]" />
        <div className="absolute bottom-4 right-4 flex gap-2">
          <span className="text-[10px] uppercase font-bold tracking-widest bg-black/40 text-zinc-300 border border-white/10 px-3 py-1 rounded-md backdrop-blur-md">
            Developer Network
          </span>
        </div>
      </div>

      {/* 2. Reddit-style 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Feed content (8 columns wide on desktop) */}
        <div className="lg:col-span-8 space-y-6">
          <ProfileTabs
            editForm={
              <form action={updateProfile} className="bg-white dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm flex flex-col gap-4">
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
                     className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all outline-none resize-none" 
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

        {/* Right column: Sticky Reddit-style Sidebar (4 columns wide on desktop) */}
        <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-6">
          <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm overflow-hidden">
            {/* Sidebar mini-header banner color */}
            <div className="h-16 bg-gradient-to-r from-accent to-purple-600 relative" />
            
            <div className="px-5 pb-6 relative">
              {/* Overlapping Profile Photo */}
              <div className="absolute -top-10 left-4">
                {user.image ? (
                  <img src={user.image} alt="Profile" className="w-20 h-20 rounded-2xl border-4 border-white dark:border-zinc-900 shadow-md shrink-0 bg-white" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-3xl font-bold text-white border-4 border-white dark:border-zinc-900 shadow-md shrink-0">
                    {user.name?.charAt(0) || 'D'}
                  </div>
                )}
              </div>
              
              {/* Info spacing to pad text below avatar */}
              <div className="pt-12">
                <h2 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white truncate">{user.name || 'Developer'}</h2>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">u/{user.email.split('@')[0]}</p>
                
                {user.bio ? (
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-3.5 italic leading-relaxed line-clamp-3">
                    &ldquo;{user.bio}&rdquo;
                  </p>
                ) : (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-3.5 italic">
                    No bio written yet. Fill in your bio details in the Edit Profile tab.
                  </p>
                )}
                
                {/* Cake Day milestones */}
                <div className="flex items-center gap-2 mt-4 text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-white/5 pt-3">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Cake Day: <strong>{cakeDayStr}</strong></span>
                </div>
                
                {/* Streak Badge & Status */}
                {(user.currentStreak > 0 || user.reputationScore > 0) && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {user.currentStreak > 0 && (
                      <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold text-[10px] border border-amber-500/20">
                        🔥 {user.currentStreak}-Day Streak
                      </span>
                    )}
                    {user.reputationScore > 0 && (
                      <span className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold text-[10px] border border-indigo-500/20">
                        ⭐ {user.reputationScore} Rep
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Reddit Karma & Cake Age Section */}
              <div className="grid grid-cols-2 gap-4 mt-5 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-white/5 rounded-xl p-3.5">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">Dev Karma</div>
                  <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-500 mt-0.5">
                    {devKarma.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">Cake Age</div>
                  <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1">
                    {cakeAgeDays} Days Old
                  </div>
                </div>
              </div>

              {/* Stats Mini Breakdown List */}
              <div className="mt-5 space-y-2.5 text-xs border-t border-zinc-100 dark:border-white/5 pt-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-2">
                      <stat.icon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      {stat.label}
                    </span>
                    <strong className="text-zinc-800 dark:text-zinc-200 font-mono">{stat.value}</strong>
                  </div>
                ))}
              </div>

              {/* Social Links List */}
              <div className="flex flex-col gap-2 mt-5 pt-4 border-t border-zinc-100 dark:border-white/5">
                <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">Developer Links</div>
                {user.githubUrl && (
                  <a href={user.githubUrl} target="_blank" className="flex items-center justify-between p-2.5 text-xs bg-zinc-50 dark:bg-zinc-950/40 hover:bg-zinc-100 dark:hover:bg-white/[0.04] border border-zinc-100 dark:border-white/5 rounded-xl text-zinc-600 dark:text-zinc-300 transition-colors">
                    <span className="flex items-center gap-2 font-semibold">
                      <Code className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> GitHub
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[120px]">@{user.githubUrl.split('/').pop()}</span>
                  </a>
                )}
                {user.twitterUrl && (
                  <a href={user.twitterUrl} target="_blank" className="flex items-center justify-between p-2.5 text-xs bg-zinc-50 dark:bg-zinc-950/40 hover:bg-zinc-100 dark:hover:bg-white/[0.04] border border-zinc-100 dark:border-white/5 rounded-xl text-zinc-600 dark:text-zinc-300 transition-colors">
                    <span className="flex items-center gap-2 font-semibold">
                      <Link2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> Twitter
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[120px]">@{user.twitterUrl.split('/').pop()}</span>
                  </a>
                )}
                {user.websiteUrl && (
                  <a href={user.websiteUrl} target="_blank" className="flex items-center justify-between p-2.5 text-xs bg-zinc-50 dark:bg-zinc-950/40 hover:bg-zinc-100 dark:hover:bg-white/[0.04] border border-zinc-100 dark:border-white/5 rounded-xl text-zinc-600 dark:text-zinc-300 transition-colors">
                    <span className="flex items-center gap-2 font-semibold">
                      <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> Website
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[120px]">{user.websiteUrl.replace(/https?:\/\/(www\.)?/, '')}</span>
                  </a>
                )}
                {user.linkedinUrl && (
                  <a href={user.linkedinUrl} target="_blank" className="flex items-center justify-between p-2.5 text-xs bg-zinc-50 dark:bg-zinc-950/40 hover:bg-zinc-100 dark:hover:bg-white/[0.04] border border-zinc-100 dark:border-white/5 rounded-xl text-zinc-600 dark:text-zinc-300 transition-colors">
                    <span className="flex items-center gap-2 font-semibold">
                      <Link2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> LinkedIn
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[120px]">@{user.linkedinUrl.split('/').pop()}</span>
                  </a>
                )}
                {!user.githubUrl && !user.twitterUrl && !user.websiteUrl && !user.linkedinUrl && (
                  <div className="text-center py-4 text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-white/10 rounded-xl">
                    No developer links added yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
