'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarCheck, Clock3, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell, EmptyState, GhostButton, PortalHeader } from '@/components/app-shell';
import { useNotifications } from '@/components/ui/notification-provider';
import { useDebounce } from '@/hooks/use-debounce';
import { api, ApiError } from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';

const PAGE_SIZE = 9;

export default function ExamsPage() {
  return (
    <AppShell>
      <ExamsContent />
    </AppShell>
  );
}

function ExamsContent() {
  const { notify } = useNotifications();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search.trim(), 300);

  const examsQuery = useQuery({
    queryKey: ['exams', { page, search: debouncedSearch }],
    queryFn: () =>
      api.listExams({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch,
      }),
  });

  useEffect(() => {
    if (!examsQuery.isError) return;
    notify({
      type: 'error',
      title: 'Não foi possível carregar os exames',
      description:
        examsQuery.error instanceof ApiError
          ? examsQuery.error.message
          : 'Tente novamente em instantes.',
    });
  }, [examsQuery.isError, examsQuery.error, notify]);

  const exams = examsQuery.data?.data ?? [];
  const meta = examsQuery.data?.meta;

  return (
    <>
      <PortalHeader
        eyebrow="Catálogo de exames"
        title="Encontre o exame certo"
        description="Consulte os exames disponíveis, veja preparo, duração estimada e escolha o melhor horário para sua rotina."
        action={
          <div className="rounded-[22px] border border-[#dce8e1] bg-white px-4 py-3 text-sm font-bold text-[#315348] shadow-sm">
            Rede A&Eight Labs
          </div>
        }
      />

      <section className="mb-7 rounded-[30px] border border-[#dfe8e2] bg-white p-4 shadow-[0_18px_60px_rgba(44,75,66,0.08)]">
        <label className="flex min-h-14 items-center gap-3 rounded-[22px] bg-[#f7faf8] px-4">
          <Search size={20} className="text-[#6f8279]" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nome do exame"
            className="h-14 min-w-0 flex-1 bg-transparent text-base font-semibold text-[#18352d] placeholder:text-[#8b9993] outline-none"
          />
        </label>
      </section>

      {examsQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-56 animate-pulse rounded-[30px] bg-white/70" />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <EmptyState
          icon={<Search size={24} />}
          title="Nenhum exame encontrado"
          description="Tente buscar por outro nome ou limpe o campo de pesquisa."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {exams.map((exam) => (
            <article
              key={exam.id}
              className="rounded-[30px] border border-[#dfe8e2] bg-white p-6 shadow-[0_18px_60px_rgba(44,75,66,0.08)] transition hover:-translate-y-1 hover:border-[#bad6ca] hover:shadow-[0_24px_70px_rgba(44,75,66,0.12)]"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eef6f2] text-[#2f7d67]">
                  <Clock3 size={21} />
                </span>
                <span className="rounded-full bg-[#f8efe1] px-3 py-1 text-xs font-black text-[#876331]">
                  {formatCurrency(exam.priceCents)}
                </span>
              </div>
              <h2 className="mt-6 text-xl font-black text-[#18352d]">{exam.name}</h2>
              <p className="mt-3 text-sm leading-6 text-[#6a7a73]">
                Duração estimada de {exam.durationInMinutes} minutos, com confirmação
                imediata no portal.
              </p>
              <div className="mt-6 grid gap-2 sm:grid-cols-[1fr_auto]">
                <Link
                  href={`/exams/${exam.id}`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#dbe7e1] bg-[#f8fbf9] px-4 text-sm font-bold text-[#315348] transition hover:border-[#9fc5b5] hover:bg-white"
                >
                  Ver detalhes
                  <ArrowRight size={17} />
                </Link>
                <Link
                  href={`/exams/${exam.id}/schedule`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#2f7d67] px-4 text-sm font-bold text-white shadow-[0_12px_26px_rgba(47,125,103,0.18)] transition hover:bg-[#276b58]"
                >
                  <CalendarCheck size={17} />
                  Agendar
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 ? (
        <div className="mt-8 flex items-center justify-between rounded-[24px] border border-[#dfe8e2] bg-white p-3">
          <GhostButton
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
          >
            Anterior
          </GhostButton>
          <p className="text-sm font-bold text-[#63736d]">
            Página {meta.page} de {meta.totalPages}
          </p>
          <GhostButton
            type="button"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((current) => Math.min(current + 1, meta.totalPages))}
          >
            Próxima
          </GhostButton>
        </div>
      ) : null}
    </>
  );
}
