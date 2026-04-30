"use server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

function sanitizeUrl(url: string | null): string | null {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();
  // Block javascript: and data: protocol XSS attempts
  if (trimmed.toLowerCase().startsWith('javascript:') || trimmed.toLowerCase().startsWith('data:')) {
    return null;
  }
  // Ensure it starts with http:// or https://
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return 'https://' + trimmed;
  }
  return trimmed;
}

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const bio = (formData.get("bio") as string || '').slice(0, 500); // Cap bio length
  const githubUrl = sanitizeUrl(formData.get("githubUrl") as string);
  const twitterUrl = sanitizeUrl(formData.get("twitterUrl") as string);
  const websiteUrl = sanitizeUrl(formData.get("websiteUrl") as string);
  const linkedinUrl = sanitizeUrl(formData.get("linkedinUrl") as string);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { bio, githubUrl, twitterUrl, websiteUrl, linkedinUrl }
  });

  revalidatePath('/profile');
}
