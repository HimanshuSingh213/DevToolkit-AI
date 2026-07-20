import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dev-toolkit-ai.vercel.app';
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login'],
      disallow: ['/workspace', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
