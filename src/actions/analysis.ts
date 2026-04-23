"use server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { GoogleGenAI } from "@google/genai"
import { revalidatePath } from "next/cache"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateMarketAnalysis(ideaId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea) throw new Error("Idea not found");

  // Check if it already exists
  const existing = await prisma.marketAnalysis.findUnique({ where: { ideaId } });
  if (existing) return existing;

  const prompt = `Perform a comprehensive market analysis for the following software idea. 
Use Google Search to find existing competitors or similar tools currently on the market.

Idea Title: ${idea.title}
Description: ${idea.description}
Target Domain: ${idea.domain}

You MUST return a raw JSON object (and absolutely nothing else, no markdown fences) matching this exact schema:
{
  "saturationScore": "String ('Low', 'Medium', or 'High')",
  "verdict": "String (A single paragraph verdict on whether this idea is worth building based on current market gaps and competitor weaknesses.)",
  "competitors": [
    {
      "name": "String (Name of the competitor)",
      "url": "String (Website URL or 'Unknown')",
      "shortcoming": "String (A brief explanation of why this competitor falls short of fully solving this specific developer pain point)"
    }
  ],
  "wedgeStrategy": [
    "String (A hyper-specific, contrarian 'wedge' feature a solo developer can build in 2 weeks that the giant competitors are completely ignoring.)",
    "String (Another hyper-specific wedge feature.)",
    "String (A third wedge feature.)"
  ]
}
Note: Return up to 4 relevant competitors and exactly 3 wedge strategies.`;

  try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
        }
      });

      const result = JSON.parse(response.text || '{}');
      
      if (!result.saturationScore || !result.verdict || !result.competitors || !result.wedgeStrategy) {
          throw new Error("LLM failed to return required schema fields.");
      }

      const newAnalysis = await prisma.marketAnalysis.create({
        data: {
          ideaId,
          saturationScore: result.saturationScore,
          verdict: result.verdict,
          competitors: result.competitors,
          wedgeStrategy: result.wedgeStrategy
        }
      });

      revalidatePath('/dashboard');
      revalidatePath(`/idea/${ideaId}`);
      
      return newAnalysis;
  } catch (error: any) {
      console.error("Market Analysis Error:", error);
      throw new Error(error.message || "Failed to generate market analysis.");
  }
}
