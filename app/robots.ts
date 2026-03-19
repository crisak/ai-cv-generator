import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/(app)/'],
    },
    sitemap: 'https://cvgenerator.app/sitemap.xml',
  }
}
