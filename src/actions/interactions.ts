"use server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export async function toggleSaveIdea(ideaId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await prisma.savedIdea.findUnique({
    where: { userId_ideaId: { userId: session.user.id, ideaId } }
  });

  if (existing) {
    await prisma.savedIdea.delete({ where: { userId_ideaId: { userId: session.user.id, ideaId } } });
  } else {
    await prisma.savedIdea.create({ data: { userId: session.user.id, ideaId } });
  }
  revalidatePath('/dashboard');
  revalidatePath('/profile');
}

export async function linkRepository(ideaId: string, url: string, openToCoFounders: boolean = false) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const repo = await prisma.repository.create({
    data: { userId: session.user.id, ideaId, url, openToCoFounders }
  });

  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    include: { savedBy: { include: { user: true } } }
  });

  // Automatically update status to IN_PROGRESS if it was OPEN
  if (idea && idea.status === 'OPEN') {
     await prisma.idea.update({ where: { id: ideaId }, data: { status: 'IN_PROGRESS' } });
  }

  // Send Email Notification to all users who saved this idea
  if (idea && process.env.RESEND_API_KEY) {
     const emails = idea.savedBy.map(s => s.user.email).filter(Boolean) as string[];
     if (emails.length > 0) {
        try {
          await resend.emails.send({
            from: 'Developers Paradise <notifications@developersparadise.dev>',
            to: emails,
            subject: `Update on saved idea: ${idea.title}`,
            html: `<p>Great news!</p><p>Someone just linked a new solution repository to an idea you saved.</p><p><strong>Idea:</strong> ${idea.title}</p><p><strong>Repository:</strong> <a href="${url}">${url}</a></p>`
          });
        } catch(e) {
          console.error("Failed to send notification email", e);
        }
     }
  }

  revalidatePath('/dashboard');
  revalidatePath('/profile');
}

export async function toggleWaitlist(ideaId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await prisma.waitlist.findUnique({
    where: { userId_ideaId: { userId: session.user.id, ideaId } }
  });

  if (existing) {
    await prisma.waitlist.delete({ where: { userId_ideaId: { userId: session.user.id, ideaId } } });
  } else {
    await prisma.waitlist.create({ data: { userId: session.user.id, ideaId } });
  }
  revalidatePath('/dashboard');
  revalidatePath('/profile');
}

export async function toggleUpvote(ideaId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await prisma.upvote.findUnique({
    where: { userId_ideaId: { userId: session.user.id, ideaId } }
  });

  if (existing) {
    await prisma.upvote.delete({ where: { userId_ideaId: { userId: session.user.id, ideaId } } });
  } else {
    await prisma.upvote.create({ data: { userId: session.user.id, ideaId } });
  }
  revalidatePath('/dashboard');
  revalidatePath('/profile');
}

export async function updateIdeaStatus(ideaId: string, status: 'OPEN' | 'IN_PROGRESS' | 'SHIPPED') {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea) throw new Error("Idea not found");
  if (idea.authorId !== session.user.id) throw new Error("Only the author can update the status");

  await prisma.idea.update({
    where: { id: ideaId },
    data: { status }
  });

  revalidatePath('/dashboard');
  revalidatePath('/profile');
}
