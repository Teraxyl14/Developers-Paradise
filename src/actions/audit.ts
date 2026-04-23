"use server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function runPerformanceAudit(repoId: string, ideaId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const repo = await prisma.repository.findUnique({ where: { id: repoId } });
  if (!repo) throw new Error("Repository not found");

  // Prevent users from auditing other people's work
  if (repo.userId !== session.user.id) throw new Error("Unauthorized: Only the author can audit this solution.");

  // We only want to audit deployed sites, not github repositories.
  if (repo.url.includes('github.com')) {
      throw new Error("Cannot audit a GitHub repository. Please link a live deployed URL (e.g. Vercel, Netlify, Render).");
  }

  try {
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(repo.url)}&category=performance&category=accessibility&category=seo&strategy=desktop`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`PageSpeed API returned ${response.status}`);
    
    const data = await response.json();
    
    const perfScore = Math.round((data.lighthouseResult?.categories?.performance?.score || 0) * 100);
    const a11yScore = Math.round((data.lighthouseResult?.categories?.accessibility?.score || 0) * 100);
    const seoScore = Math.round((data.lighthouseResult?.categories?.seo?.score || 0) * 100);
    
    let screenshotUrl = null;
    const screenshotData = data.lighthouseResult?.audits?.['final-screenshot']?.details?.data;
    if (screenshotData) {
        screenshotUrl = screenshotData;
    }

    await prisma.repository.update({
        where: { id: repoId },
        data: { perfScore, a11yScore, seoScore, screenshotUrl }
    });

    revalidatePath('/dashboard');
    revalidatePath(`/idea/${ideaId}`);
    return { success: true };

  } catch (error: any) {
    console.error("Audit failed:", error);
    throw new Error(error.message || "Failed to complete the performance audit. The site might be unreachable.");
  }
}
