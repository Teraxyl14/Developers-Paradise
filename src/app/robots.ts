import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://developers-paradise.com'

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/projects/*', '/trends'],
      disallow: ['/admin/', '/inbox/', '/submit/', '/api/', '/dashboard/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
