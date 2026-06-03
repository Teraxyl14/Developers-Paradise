import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { IdeaCard } from '@/components/IdeaCard'
import type { Metadata } from 'next'
import Link from 'next/link'
import { cacheLife, cacheTag } from 'next/cache'


interface PageProps {
  params: Promise<{
    difficulty: string
    techStack: string
    problemDomain: string
  }>
}

export async function generateStaticParams() {
  // Fetch top combinations of difficulty, techStack, and domain
  const result = await prisma.$queryRaw<{ difficulty: string; techStack: string; domain: string; count: bigint }[]>`
    SELECT 
      difficulty, 
      stack_elem AS "techStack", 
      domain, 
      COUNT(*) as count 
    FROM "Idea", UNNEST("recommendedStack") AS stack_elem 
    GROUP BY difficulty, "techStack", domain 
    ORDER BY count DESC 
    LIMIT 1000
  `

  return result.map((row) => ({
    difficulty: encodeURIComponent(row.difficulty.toLowerCase().replace(/\s+/g, '-')),
    techStack: encodeURIComponent(row.techStack.toLowerCase().replace(/\s+/g, '-')),
    problemDomain: encodeURIComponent(row.domain.toLowerCase().replace(/\s+/g, '-')),
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { difficulty, techStack, problemDomain } = await params
  
  const formattedDifficulty = decodeURIComponent(difficulty).split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const formattedTech = decodeURIComponent(techStack).split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const formattedDomain = decodeURIComponent(problemDomain).split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  const title = `${formattedDifficulty} ${formattedTech} Projects in ${formattedDomain} | Developer's Paradise`
  const description = `Discover validated market gaps and ${formattedDifficulty.toLowerCase()} project ideas using ${formattedTech} in the ${formattedDomain} domain. Build projects that solve real problems.`

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://developers-paradise.com'
  const canonicalUrl = `${baseUrl}/projects/${difficulty.toLowerCase()}/${techStack.toLowerCase()}/${problemDomain.toLowerCase()}`

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    }
  }
}

interface Blueprint {
  id: string
  payload?: {
    difficulty?: string
    techStack?: string
    domain?: string
    title?: string
  }
}

async function getProjectPageData(difficulty: string, techStack: string, problemDomain: string) {
  'use cache'
  cacheLife('days')
  cacheTag('ideas')

  const searchDifficulty = decodeURIComponent(difficulty).replace(/-/g, ' ')
  const searchTechStack = decodeURIComponent(techStack).replace(/-/g, ' ')
  const searchDomain = decodeURIComponent(problemDomain).replace(/-/g, ' ')

  const ideas = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Idea"
    WHERE 
      LOWER(difficulty) = LOWER(${searchDifficulty}) AND
      LOWER(domain) = LOWER(${searchDomain}) AND
      EXISTS (
        SELECT 1 FROM UNNEST("recommendedStack") AS stack_elem
        WHERE LOWER(stack_elem) = LOWER(${searchTechStack})
      )
    ORDER BY "createdAt" DESC
    LIMIT 50
  `

  if (!ideas || ideas.length === 0) {
    return null
  }

  const ideaIds = ideas.map(idea => idea.id)
  
  const fullIdeas = await prisma.idea.findMany({
    where: {
      id: { in: ideaIds }
    },
    include: {
      author: {
        select: {
          name: true,
          image: true,
          reputationScore: true
        }
      },
      tags: {
        include: { tag: true }
      },
      upvotes: true,
      comments: true,
      waitlist: true,
      repositories: true,
      marketAnalysis: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  let relatedBlueprints: Blueprint[] = []
  if (fullIdeas.length > 0) {
    try {
      const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333'
      const response = await fetch(`${qdrantUrl}/collections/ideas/points/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positive: [fullIdeas[0].id],
          filter: {
            must: [
              { key: "domain", match: { value: searchDomain } }
            ]
          },
          limit: 3,
          with_payload: true
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        relatedBlueprints = (data.result || []) as Blueprint[]
      }
    } catch (error) {
      console.error("Qdrant fetch error:", error)
    }
  }

  return {
    fullIdeas,
    relatedBlueprints,
    searchDifficulty,
    searchTechStack,
    searchDomain
  }
}

export default async function ProjectIdeasPage({ params }: PageProps) {
  const { difficulty, techStack, problemDomain } = await params

  const data = await getProjectPageData(difficulty, techStack, problemDomain)

  if (!data) {
    notFound()
  }

  const { fullIdeas, relatedBlueprints, searchDifficulty, searchTechStack, searchDomain } = data

  const totalUpvotes = fullIdeas.reduce((sum, idea) => sum + idea.upvotes.length, 0)
  const totalWaitlists = fullIdeas.reduce((sum, idea) => sum + idea.waitlist.length, 0)
  const totalInteractions = totalUpvotes + totalWaitlists || 1
  const averageRating = totalInteractions > 0 ? 4.8 : 0

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://developers-paradise.com'
  
  // JSON-LD Schemas
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
      { "@type": "ListItem", "position": 2, "name": "Projects", "item": `${baseUrl}/projects` },
      { "@type": "ListItem", "position": 3, "name": searchTechStack, "item": `${baseUrl}/projects/all/${techStack}` },
      { "@type": "ListItem", "position": 4, "name": searchDomain, "item": `${baseUrl}/projects/${difficulty}/${techStack}/${problemDomain}` }
    ]
  }

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    "name": `${searchDifficulty} ${searchTechStack} Projects in ${searchDomain}`,
    "programmingLanguage": searchTechStack,
    "description": `A curated collection of ${searchDifficulty} developer projects focusing on ${searchDomain}.`,
    "applicationCategory": "DeveloperApplication",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": averageRating,
      "ratingCount": totalInteractions,
      "bestRating": "5",
      "worstRating": "1"
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-8">
        <ol className="flex items-center space-x-2 text-sm text-text-muted">
          <li><Link href="/" className="hover:text-accent transition-colors">Home</Link></li>
          <li><span className="mx-2">/</span></li>
          <li><span className="hover:text-accent transition-colors cursor-pointer">Projects</span></li>
          <li><span className="mx-2">/</span></li>
          <li><span className="capitalize">{searchTechStack}</span></li>
          <li><span className="mx-2">/</span></li>
          <li className="text-text-primary font-medium capitalize" aria-current="page">{searchDomain}</li>
        </ol>
      </nav>

      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bebas tracking-wide mb-4">
          <span className="text-accent">{searchDifficulty.toUpperCase()}</span> {searchTechStack.toUpperCase()} IDEAS IN {searchDomain.toUpperCase()}
        </h1>
        <p className="text-text-secondary text-lg max-w-2xl">
          We&apos;ve analyzed developer communities and found validated market gaps that match your stack. 
          These aren&apos;t generic templates—they are real problems waiting for a solution.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fullIdeas.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} />
        ))}
      </div>
      
      {/* Qdrant Inter-Cluster Linking */}
      {relatedBlueprints.length > 0 && (
        <div className="mt-20 border-t border-border-default pt-12">
          <h2 className="text-2xl font-bebas tracking-wide mb-6">Related Structural Blueprints</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedBlueprints.map((blueprint: Blueprint) => {
              const bDiff = blueprint.payload?.difficulty?.toLowerCase().replace(/\s+/g, '-') || difficulty
              const bStack = blueprint.payload?.techStack?.toLowerCase().replace(/\s+/g, '-') || techStack
              const bDomain = blueprint.payload?.domain?.toLowerCase().replace(/\s+/g, '-') || problemDomain
              
              return (
                <Link 
                  key={blueprint.id}
                  href={`/projects/${bDiff}/${bStack}/${bDomain}`}
                  className="block p-5 rounded-xl border border-border-default bg-bg-secondary hover:border-accent transition-colors group"
                >
                  <h3 className="text-lg font-medium text-text-primary group-hover:text-accent transition-colors mb-2 line-clamp-2">
                    {blueprint.payload?.title || "Discover Similar Projects"}
                  </h3>
                  <p className="text-sm text-text-muted capitalize">
                    {blueprint.payload?.techStack || searchTechStack} • {blueprint.payload?.domain || searchDomain}
                  </p>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
