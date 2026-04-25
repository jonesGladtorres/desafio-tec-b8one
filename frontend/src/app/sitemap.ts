import type { MetadataRoute } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';

async function fetchExamIds(): Promise<string[]> {
  try {
    const response = await fetch(`${API_URL}/exams?page=1&limit=100`, {
      headers: { 'X-API-Version': '1' },
      next: { revalidate: 3600 },
    });

    if (!response.ok) return [];

    const data = (await response.json()) as { data: { id: string }[] };
    return data.data.map((exam) => exam.id);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const examIds = await fetchExamIds();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/exams`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  const examRoutes: MetadataRoute.Sitemap = examIds.map((id) => ({
    url: `${SITE_URL}/exams/${id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...examRoutes];
}
