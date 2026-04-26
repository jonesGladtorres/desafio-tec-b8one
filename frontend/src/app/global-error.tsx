'use client';

import { useEffect } from 'react';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Global error boundary:', error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#f6f8f5',
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
          color: '#18352d',
        }}
      >
        <main
          style={{
            background: '#fff',
            padding: '2.5rem',
            borderRadius: '24px',
            border: '1px solid #dfe8e2',
            maxWidth: '480px',
            textAlign: 'center',
            boxShadow: '0 24px 70px rgba(44,75,66,0.10)',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 800 }}>
            Erro inesperado
          </h1>
          <p style={{ marginTop: '1rem', color: '#66756f', lineHeight: 1.6 }}>
            Não foi possível continuar. Recarregue a página — se persistir, volte
            mais tarde.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '1.5rem',
              background: '#2f7d67',
              color: '#fff',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Tentar novamente
          </button>
        </main>
      </body>
    </html>
  );
}
