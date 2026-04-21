"use server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const bio = formData.get("bio") as string;
  const githubUrl = formData.get("githubUrl") as string;
  const twitterUrl = formData.get("twitterUrl") as string;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { bio, githubUrl, twitterUrl }
  });

  revalidatePath('/profile');
}
