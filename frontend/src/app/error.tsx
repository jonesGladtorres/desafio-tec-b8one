'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalRouteError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Em produção viraria envio para Sentry/observabilidade.
    console.error('Route error boundary:', error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f8f5] px-6 py-10">
      <section className="w-full max-w-xl rounded-[32px] border border-[#dfe8e2] bg-white p-8 text-center shadow-[0_24px_70px_rgba(44,75,66,0.10)]">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#fff1ef] text-[#9a4d45]">
          <AlertTriangle size={26} />
        </span>
        <h1 className="mt-6 text-2xl font-black tracking-tight text-[#18352d]">
          Algo deu errado por aqui
        </h1>
        <p className="mt-3 text-base leading-7 text-[#66756f]">
          Não foi possível carregar essa página. Tente novamente em instantes — se o
          problema persistir, volte para o início e refaça o caminho.
        </p>
        {error.digest ? (
          <p className="mt-3 text-xs font-mono text-[#8b9993]">
            ref: {error.digest}
          </p>
        ) : null}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#2f7d67] px-5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(47,125,103,0.22)] transition hover:bg-[#276b58]"
          >
            <RefreshCw size={17} />
            Tentar novamente
          </button>
          <Link
            href="/exams"
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#dbe7e1] bg-white px-5 text-sm font-bold text-[#315348] transition hover:border-[#9fc5b5]"
          >
            Voltar ao catálogo
          </Link>
        </div>
      </section>
    </main>
  );
}
