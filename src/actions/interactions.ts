"use server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function upvoteIdea(ideaId: string) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) throw new Error("Unauthorized");

  // Ensure user exists in DB to prevent foreign key violations
  await prisma.user.upsert({
    where: { id: session.user.id },
    update: {},
    create: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    }
  });

  const existing = await prisma.upvote.findUnique({
    where: {
      userId_ideaId: {
        userId: session.user.id,
        ideaId: ideaId
      }
    }
  });

  if (existing) {
    await prisma.upvote.delete({
      where: {
        userId_ideaId: {
          userId: session.user.id,
          ideaId: ideaId
        }
      }
    });
  } else {
    await prisma.upvote.create({
      data: {
        userId: session.user.id,
        ideaId: ideaId
      }
    });
  }

  revalidatePath('/dashboard');
  revalidatePath('/profile');
}

export async function toggleWaitlist(ideaId: string) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) throw new Error("Unauthorized");

  // Ensure user exists in DB
  await prisma.user.upsert({
    where: { id: session.user.id },
    update: {},
    create: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    }
  });

  const existing = await prisma.waitlist.findUnique({
    where: {
      userId_ideaId: {
        userId: session.user.id,
        ideaId: ideaId
      }
    }
  });

  if (existing) {
    await prisma.waitlist.delete({
      where: {
        userId_ideaId: {
          userId: session.user.id,
          ideaId: ideaId
        }
      }
    });
  } else {
    await prisma.waitlist.create({
      data: {
        userId: session.user.id,
        ideaId: ideaId
      }
    });
  }

  revalidatePath('/dashboard');
}

export async function addComment(ideaId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) throw new Error("Unauthorized");
  if (!content.trim()) return;

  // Ensure user exists in DB
  await prisma.user.upsert({
    where: { id: session.user.id },
    update: {},
    create: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    }
  });

  await prisma.comment.create({
    data: {
      content,
      userId: session.user.id,
      ideaId
    }
  });

  revalidatePath('/dashboard');
}
