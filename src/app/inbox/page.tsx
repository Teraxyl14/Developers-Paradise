import { getConversations } from "@/actions/messages"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { InboxView } from "./InboxView"
import prisma from "@/lib/prisma"

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ composeTo?: string, context?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/api/auth/signin');

  const resolvedParams = await searchParams;
  const messages = await getConversations();

  // If coming from "Message Developer" button
  let defaultContact = null;
  let defaultContext = null;
  
  if (resolvedParams.composeTo) {
      defaultContact = await prisma.user.findUnique({
          where: { id: resolvedParams.composeTo },
          select: { id: true, name: true, image: true }
      });
  }
  if (resolvedParams.context) {
      defaultContext = await prisma.idea.findUnique({
          where: { id: resolvedParams.context },
          select: { id: true, title: true }
      });
  }

  return (
    <main className="max-w-6xl mx-auto py-8 px-4 h-[calc(100vh-140px)] flex flex-col">
       <div className="mb-6">
         <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Co-founder Inbox</h1>
         <p className="text-zinc-500 dark:text-zinc-400">Collaborate with developers building solutions.</p>
       </div>
       <div className="flex-1 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row min-h-0">
          <InboxView 
             initialMessages={messages} 
             currentUserId={session.user.id} 
             defaultContact={defaultContact}
             defaultContext={defaultContext}
          />
       </div>
    </main>
  );
}
