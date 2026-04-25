import type { Metadata, Viewport } from 'next';
import { QueryProvider } from '@/components/query-provider';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';
const SITE_NAME = 'A&Eight Labs | Portal do Paciente';

export const viewport: Viewport = {
  themeColor: '#2f7d67',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | A&Eight Labs`,
  },
  description:
    'Portal de agendamento de exames laboratoriais da rede A&Eight Labs. Busque exames, agende horários e acompanhe sua agenda online.',
  keywords: ['exames laboratoriais', 'agendamento de exames', 'laboratório', 'A&Eight Labs'],
  authors: [{ name: 'A&Eight Labs' }],
  creator: 'A&Eight Labs',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description:
      'Busque exames, agende horários e acompanhe sua agenda na rede A&Eight Labs.',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description:
      'Busque exames, agende horários e acompanhe sua agenda na rede A&Eight Labs.',
  },
  robots: {
    // Portal autenticado: não indexar páginas internas
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
