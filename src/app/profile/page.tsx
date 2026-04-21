import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { IdeaCard } from "@/components/IdeaCard"
import { redirect } from "next/navigation"
import { updateProfile } from "@/actions/profile"
import { Code, Link2, Save } from "lucide-react"
import { SubmitButton } from "@/components/SubmitButton"

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

  return (
    <main className="max-w-4xl mx-auto py-10 px-4 text-zinc-900 dark:text-white">
      <div className="flex flex-col md:flex-row items-start gap-8 mb-10">
        <div className="flex-1 flex items-center gap-4 bg-white dark:bg-zinc-900/50 p-6 rounded-xl border border-zinc-200 dark:border-white/10 shadow-sm w-full">
          {user.image ? (
             <img src={user.image} alt="Profile" className="w-16 h-16 rounded-full border-2 border-white dark:border-zinc-800 shadow-sm shrink-0" />
          ) : (
             <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xl font-bold text-zinc-500 dark:text-zinc-400 border-2 border-white dark:border-zinc-800 shadow-sm shrink-0">
               {user.name?.charAt(0) || 'D'}
             </div>
          )}
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight truncate">{user.name || 'Developer'}</h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium truncate">{user.email}</p>
          </div>
        </div>

        <form action={updateProfile} className="w-full md:w-[400px] bg-white dark:bg-zinc-900/50 p-6 rounded-xl border border-zinc-200 dark:border-white/10 shadow-sm shrink-0 flex flex-col gap-4">
           <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-1">Edit Profile</h3>
           <div>
             <input name="bio" defaultValue={user.bio || ''} placeholder="Bio / Headline..." className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" />
           </div>
           <div className="flex items-center gap-2">
             <Code className="w-4 h-4 text-zinc-400 shrink-0" />
             <input name="githubUrl" type="url" defaultValue={user.githubUrl || ''} placeholder="https://github.com/yourname" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" />
           </div>
           <div className="flex items-center gap-2">
             <Link2 className="w-4 h-4 text-zinc-400 shrink-0" />
             <input name="twitterUrl" type="url" defaultValue={user.twitterUrl || ''} placeholder="https://twitter.com/yourname" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" />
           </div>
           <SubmitButton className="w-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold py-2 rounded-lg text-sm transition-colors shadow-sm mt-2" loadingText="Saving...">
             <Save className="w-4 h-4" /> Save Profile
           </SubmitButton>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4 border-b border-zinc-200 dark:border-white/10 pb-2 tracking-tight">Saved Ideas</h2>
            {user.savedIdeas.map(({ idea }) => (
               <IdeaCard key={idea.id} idea={idea} />
            ))}
            {user.savedIdeas.length === 0 && <p className="text-zinc-500">No saved ideas yet.</p>}
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-4 border-b border-zinc-200 dark:border-white/10 pb-2 tracking-tight">My Submitted Ideas</h2>
            {user.submittedIdeas.map((idea) => (
               <IdeaCard key={idea.id} idea={idea} />
            ))}
            {user.submittedIdeas.length === 0 && <p className="text-zinc-500">You haven't submitted any ideas yet.</p>}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b border-zinc-200 dark:border-white/10 pb-2 tracking-tight">My Active Projects</h2>
          <ul className="space-y-3">
            {user.repositories.map(repo => (
              <li key={repo.id} className="bg-white dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-white/10 shadow-sm">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Building solution for: <span className="text-zinc-900 dark:text-white font-medium">{repo.idea.title}</span></p>
                <a href={repo.url} target="_blank" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-medium break-all">{repo.url}</a>
              </li>
            ))}
            {user.repositories.length === 0 && <p className="text-zinc-500">No repositories linked yet.</p>}
          </ul>
        </section>
      </div>
    </main>
  );
}
