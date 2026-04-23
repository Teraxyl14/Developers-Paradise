"use server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { GoogleGenAI } from "@google/genai"
import { revalidatePath } from "next/cache"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateRepoRoast(repoId: string, ideaId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const repo = await prisma.repository.findUnique({ where: { id: repoId } });
  if (!repo) throw new Error("Repository not found");
  
  if (repo.userId !== session.user.id) throw new Error("Unauthorized: Only the author can roast their architecture.");
  
  if (!repo.url.includes('github.com')) {
      throw new Error("The Repo Roaster only works with GitHub repository URLs (e.g. https://github.com/user/repo).");
  }

  try {
      // 1. Extract owner/repo
      const match = repo.url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) throw new Error("Invalid GitHub URL format.");
      const owner = match[1];
      const repoName = match[2].replace('.git', '');

      // 2. Fetch File Tree
      const ghHeaders: HeadersInit = process.env.GH_GRAPHQL_TOKEN && process.env.GH_GRAPHQL_TOKEN !== 'your_github_pat' 
          ? { Authorization: `Bearer ${process.env.GH_GRAPHQL_TOKEN}` } 
          : {};

      const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/trees/main?recursive=1`, { headers: ghHeaders });
      let treeData = await treeRes.json();
      
      if (!treeRes.ok) {
          // Fallback to master if main fails
          const masterRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/trees/master?recursive=1`, { headers: ghHeaders });
          if (!masterRes.ok) throw new Error("Could not fetch repository file tree. Ensure the repo is public or you have the correct default branch.");
          treeData = await masterRes.json();
      }

      const filePaths = treeData.tree.filter((t: any) => t.type === 'blob').map((t: any) => t.path).slice(0, 100);
      
      // 3. Fetch package.json for dependency analysis
      let packageJson = "";
      const pkgRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repoName}/main/package.json`);
      if (pkgRes.ok) packageJson = await pkgRes.text();

      // 4. Prompt Gemini
      const prompt = `
      Act as a brutally honest, highly experienced Staff Software Engineer. 
      I am a junior/mid-level developer building an MVP. I want you to "Roast my Architecture" based on the following context.
      
      Be incredibly harsh but ultimately constructive. Point out obvious security flaws, scalability bottlenecks, bloated dependencies, and praise any actually good architectural choices you see.
      Keep it punchy, technical, and use markdown formatting.

      Repository URL: ${repo.url}
      
      Top 100 File Paths in Repository:
      ${filePaths.join('\n')}

      package.json (if exists):
      ${packageJson || "Not found or not a Node.js project."}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
      });

      const report = response.text || "Failed to generate report.";

      await prisma.repository.update({
          where: { id: repoId },
          data: { architectureReport: report }
      });

      revalidatePath('/dashboard');
      revalidatePath(`/idea/${ideaId}`);
      return { success: true };

  } catch (error: any) {
      console.error("Roast failed:", error);
      throw new Error(error.message || "Failed to complete the automated codebase review.");
  }
}
