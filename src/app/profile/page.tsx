import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { updateProfile } from "@/actions/profile"
import { Code, Link2, Save, Globe, Calendar, ChevronUp, Bookmark, MessageSquare, GitBranch, Lightbulb } from "lucide-react"
import { SubmitButton } from "@/components/SubmitButton"
import { IdeaCard } from "@/components/IdeaCard"
import { ProfileTabs } from "./ProfileTabs"

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/api/auth/signin');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      savedIdeas: { include: { idea: { include: { tags: { include: { tag: true } }, repositories: true, savedBy: true, author: true, upvotes: true, waitlist: true, _count: { select: { upvotes: true, comments: true } } } } } },
      repositories: { include: { idea: true, user: true } },
      submittedIdeas: { include: { tags: { include: { tag: true } }, repositories: true, savedBy: true, author: true, upvotes: true, waitlist: true, _count: { select: { upvotes: true, comments: true } } } }
    }
  });

  if (!user) return null;

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

  return (
    <main className="max-w-4xl mx-auto py-10 px-4 text-zinc-900 dark:text-white">
      {/* Profile Header */}
      <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="flex items-center gap-4 flex-1">
            {user.image ? (
               <img src={user.image} alt="Profile" className="w-20 h-20 rounded-2xl border-2 border-white dark:border-zinc-800 shadow-sm shrink-0" />
            ) : (
               <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white border-2 border-white dark:border-zinc-800 shadow-sm shrink-0">
                 {user.name?.charAt(0) || 'D'}
               </div>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight truncate">{user.name || 'Developer'}</h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm truncate">{user.email}</p>
              {user.bio && <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">{user.bio}</p>}
              <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-400">
                <Calendar className="w-3 h-3" />
                Member since {new Date(user.emailVerified ?? Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Social links display */}
          <div className="flex flex-wrap gap-2">
            {user.githubUrl && (
              <a href={user.githubUrl} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors">
                <Code className="w-3 h-3" /> GitHub
              </a>
            )}
            {user.twitterUrl && (
              <a href={user.twitterUrl} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors">
                <Link2 className="w-3 h-3" /> Twitter
              </a>
            )}
            {user.websiteUrl && (
              <a href={user.websiteUrl} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors">
                <Globe className="w-3 h-3" /> Website
              </a>
            )}
            {user.linkedinUrl && (
              <a href={user.linkedinUrl} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors">
                <Link2 className="w-3 h-3" /> LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-white/10 shadow-sm text-center">
            <stat.icon className="w-4 h-4 text-zinc-400 mx-auto mb-1.5" />
            <div className="text-xl font-bold text-zinc-900 dark:text-white">{stat.value}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabbed Content */}
      <ProfileTabs
        editForm={
          <form action={updateProfile} className="bg-white dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm flex flex-col gap-4">
             <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-1">Edit Profile</h3>
             <div>
               <input name="bio" defaultValue={user.bio || ''} placeholder="Bio / Headline..." className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" />
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               <div className="flex items-center gap-2">
                 <Code className="w-4 h-4 text-zinc-400 shrink-0" />
                 <input name="githubUrl" type="url" defaultValue={user.githubUrl || ''} placeholder="https://github.com/you" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" />
               </div>
               <div className="flex items-center gap-2">
                 <Link2 className="w-4 h-4 text-zinc-400 shrink-0" />
                 <input name="twitterUrl" type="url" defaultValue={user.twitterUrl || ''} placeholder="https://twitter.com/you" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" />
               </div>
               <div className="flex items-center gap-2">
                 <Globe className="w-4 h-4 text-zinc-400 shrink-0" />
                 <input name="websiteUrl" type="url" defaultValue={user.websiteUrl || ''} placeholder="https://yoursite.com" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" />
               </div>
               <div className="flex items-center gap-2">
                 <Link2 className="w-4 h-4 text-zinc-400 shrink-0" />
                 <input name="linkedinUrl" type="url" defaultValue={user.linkedinUrl || ''} placeholder="https://linkedin.com/in/you" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" />
               </div>
             </div>
             <SubmitButton className="w-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold py-2 rounded-lg text-sm transition-colors shadow-sm mt-2" loadingText="Saving...">
               <Save className="w-4 h-4" /> Save Profile
             </SubmitButton>
          </form>
        }
        submittedIdeas={user.submittedIdeas}
        savedIdeas={user.savedIdeas.map(s => s.idea)}
        repositories={user.repositories}
      />
    </main>
  );
}
