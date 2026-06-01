import { MetadataRoute } from 'next'
import prisma from '@/lib/prisma'

const ITEMS_PER_SITEMAP = 40000

export async function generateSitemaps() {
  // Determine how many items there are in total for dynamic routes
  const countResult = await prisma.$queryRaw<{ total: bigint }[]>`
    SELECT COUNT(*) as total
    FROM (
      SELECT difficulty, stack_elem, domain 
      FROM "Idea", UNNEST("recommendedStack") AS stack_elem 
      GROUP BY difficulty, stack_elem, domain
    ) as unique_combinations
  `
  
  const total = Number(countResult[0]?.total || 0)
  // Ensure at least 1 sitemap is generated
  const numSitemaps = Math.max(1, Math.ceil(total / ITEMS_PER_SITEMAP))

  return Array.from({ length: numSitemaps }, (_, i) => ({ id: i }))
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://developers-paradise.com'

  const sitemapId = id ?? 0
  const offset = sitemapId * ITEMS_PER_SITEMAP

  // Fetch combinations for this specific chunk
  const result = await prisma.$queryRaw<{ difficulty: string; techStack: string; domain: string; count: bigint }[]>`
    SELECT 
      difficulty, 
      stack_elem AS "techStack", 
      domain, 
      COUNT(*) as count 
    FROM "Idea", UNNEST("recommendedStack") AS stack_elem 
    GROUP BY difficulty, "techStack", domain 
    ORDER BY count DESC 
    LIMIT ${ITEMS_PER_SITEMAP} OFFSET ${offset}
  `

  const dynamicRoutes = result.map((row) => {
    const difficulty = encodeURIComponent(row.difficulty.toLowerCase().replace(/\s+/g, '-'))
    const techStack = encodeURIComponent(row.techStack.toLowerCase().replace(/\s+/g, '-'))
    const domain = encodeURIComponent(row.domain.toLowerCase().replace(/\s+/g, '-'))

    return {
      url: `${baseUrl}/projects/${difficulty}/${techStack}/${domain}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }
  })

  // Only include static routes in the first sitemap chunk
  if (sitemapId === 0) {
    const staticRoutes = [
      '',
      '/trends',
      '/submit',
      '/leaderboard',
    ].map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: route === '' ? 1.0 : 0.7,
    }))

    return [...staticRoutes, ...dynamicRoutes]
  }

  return dynamicRoutes
}
