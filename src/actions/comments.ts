"use server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function addComment(ideaId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (!content.trim()) throw new Error("Content cannot be empty");
  if (content.length > 2000) throw new Error("Comment is too long (max 2000 characters)");

  await prisma.comment.create({
    data: {
      userId: session.user.id,
      ideaId,
      content: content.trim()
    }
  });

  const idea = await prisma.idea.findUnique({ where: { id: ideaId }, select: { authorId: true } });
  if (idea && idea.authorId && idea.authorId !== session.user.id) {
      await prisma.notification.create({
          data: {
              userId: idea.authorId,
              actorId: session.user.id,
              ideaId,
              type: 'COMMENT',
              content: 'commented on your idea.'
          }
      });
  }

  revalidatePath('/dashboard');
}

export async function getComments(ideaId: string) {
  return prisma.comment.findMany({
    where: { ideaId },
    include: {
      user: { select: { name: true, image: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}
