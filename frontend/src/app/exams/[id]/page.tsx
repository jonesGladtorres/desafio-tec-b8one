import type { Metadata } from 'next';
import { ExamDetailsClient } from './client';

type Props = {
  params: Promise<{ id: string }>;
};

const SERVER_API_URL =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:8000';

async function fetchExamServer(id: string) {
  try {
    const response = await fetch(`${SERVER_API_URL}/exams/${id}`, {
      headers: { 'X-API-Version': '1' },
      next: { revalidate: 300 },
    });

    if (!response.ok) return null;

    return response.json() as Promise<{
      id: string;
      name: string;
      description: string;
      durationInMinutes: number;
      priceCents: number;
      preparationInstructions: string | null;
    }>;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const exam = await fetchExamServer(id);

  if (!exam) {
    return {
      title: 'Exame não encontrado',
      description: 'O exame solicitado não foi encontrado na rede A&Eight Labs.',
    };
  }

  const price = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(exam.priceCents / 100);

  const description = `${exam.description} Duração: ${exam.durationInMinutes} min · ${price}. Agende online com confirmação imediata.`;

  return {
    title: exam.name,
    description,
    openGraph: {
      title: `${exam.name} | A&Eight Labs`,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${exam.name} | A&Eight Labs`,
      description,
    },
  };
}

export default async function ExamDetailsPage({ params }: Props) {
  const { id } = await params;
  const exam = await fetchExamServer(id);

  const jsonLd = exam
    ? {
        '@context': 'https://schema.org',
        '@type': 'MedicalTest',
        name: exam.name,
        description: exam.description,
        usedToDiagnose: exam.description,
        normalRange: `Duração estimada: ${exam.durationInMinutes} minutos`,
        provider: {
          '@type': 'MedicalOrganization',
          name: 'A&Eight Labs',
        },
      }
    : null;

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
      <ExamDetailsClient />
    </>
  );
}
