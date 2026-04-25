import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';

  return {
    rules: {
      userAgent: '*',
      disallow: '/', // portal autenticado — não indexar
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
