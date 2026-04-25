'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  WalletCards,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  AppShell,
  DetailRow,
  GhostButton,
  PortalHeader,
  SoftButton,
} from '@/components/app-shell';
import { api, ApiError } from '@/lib/api';
import { formatCurrency, toDateInputValue } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export default function ExamDetailsPage() {
  return (
    <AppShell>
      <ExamDetailsContent />
    </AppShell>
  );
}

function ExamDetailsContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(() => toDateInputValue(tomorrow()));
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const examQuery = useQuery({
    queryKey: ['exam', params.id],
    queryFn: () => api.getExam(params.id),
  });

  const slotsQuery = useQuery({
    queryKey: ['slots', params.id, date],
    queryFn: () => api.getAvailableSlots(params.id, date),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createAppointment({
        examId: params.id,
        scheduledAt: selectedSlot ?? '',
        notes: notes.trim() || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      router.push('/appointments');
    },
  });

  const exam = examQuery.data;
  const errorMessage =
    createMutation.error instanceof ApiError
      ? createMutation.error.message
      : createMutation.error
        ? 'Nao foi possivel criar o agendamento.'
        : null;

  return (
    <>
      <PortalHeader
        eyebrow="Detalhe do exame"
        title={exam?.name ?? 'Carregando exame'}
        description={
          exam?.description ??
          'Estamos buscando as informacoes mais recentes deste exame.'
        }
        action={
          <Link
            href="/exams"
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[#dbe7e1] bg-white px-5 text-sm font-bold text-[#315348]"
          >
            <ArrowLeft size={17} />
            Voltar
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="rounded-[32px] border border-[#dfe8e2] bg-white p-6 shadow-[0_18px_60px_rgba(44,75,66,0.08)]">
          {examQuery.isLoading || !exam ? (
            <div className="h-96 animate-pulse rounded-[28px] bg-[#f4f8f5]" />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <DetailRow
                  label="Valor"
                  value={formatCurrency(exam.priceCents)}
                />
                <DetailRow
                  label="Duracao"
                  value={`${exam.durationInMinutes} minutos`}
                />
                <DetailRow label="Unidade" value="Rede A&Eight" />
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <article className="rounded-[28px] bg-[#f7faf8] p-6">
                  <FileText className="text-[#2f7d67]" size={24} />
                  <h2 className="mt-4 text-lg font-black text-[#18352d]">
                    Sobre o exame
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[#63736d]">
                    {exam.description}
                  </p>
                </article>
                <article className="rounded-[28px] bg-[#fff8eb] p-6">
                  <CheckCircle2 className="text-[#9a7332]" size={24} />
                  <h2 className="mt-4 text-lg font-black text-[#4d3a1c]">
                    Preparo
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[#786343]">
                    {exam.preparationInstructions ??
                      'Sem preparo especial cadastrado.'}
                  </p>
                </article>
              </div>
            </>
          )}
        </section>

        <aside className="rounded-[32px] border border-[#dfe8e2] bg-white p-6 shadow-[0_18px_60px_rgba(44,75,66,0.08)]">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eef6f2] text-[#2f7d67]">
              <CalendarCheck size={22} />
            </span>
            <div>
              <h2 className="text-xl font-black text-[#18352d]">Agendar</h2>
              <p className="text-sm font-semibold text-[#7a8983]">
                Escolha um horario disponivel
              </p>
            </div>
          </div>

          <label className="mt-6 block">
            <span className="mb-2 block text-sm font-bold text-[#315348]">
              Data
            </span>
            <input
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setSelectedSlot(null);
              }}
              type="date"
              className="h-12 w-full rounded-2xl border border-[#dbe7e1] bg-[#f8fbf9] px-4 text-sm font-bold text-[#18352d]"
            />
          </label>

          <div className="mt-5 grid grid-cols-2 gap-2">
            {slotsQuery.isLoading ? (
              <div className="col-span-2 flex h-28 items-center justify-center rounded-2xl bg-[#f8fbf9] text-[#6f8279]">
                <Loader2 className="animate-spin" size={22} />
              </div>
            ) : (
              slotsQuery.data?.slots.map((slot) => (
                <button
                  key={slot.startsAt}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => setSelectedSlot(slot.startsAt)}
                  className={cn(
                    'rounded-2xl border px-3 py-3 text-sm font-black transition',
                    selectedSlot === slot.startsAt
                      ? 'border-[#2f7d67] bg-[#2f7d67] text-white'
                      : 'border-[#dbe7e1] bg-[#f8fbf9] text-[#315348] hover:border-[#9fc5b5]',
                    !slot.available &&
                      'cursor-not-allowed border-[#e4e9e6] bg-[#f0f3f1] text-[#a0aaa5]',
                  )}
                >
                  {new Date(slot.startsAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'UTC',
                  })}
                </button>
              ))
            )}
          </div>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-bold text-[#315348]">
              Observacoes
            </span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              maxLength={500}
              className="w-full resize-none rounded-2xl border border-[#dbe7e1] bg-[#f8fbf9] px-4 py-3 text-sm font-semibold text-[#18352d]"
              placeholder="Preferencias ou informacoes para a unidade"
            />
          </label>

          {errorMessage ? (
            <p className="mt-4 rounded-2xl bg-[#fff1ef] px-4 py-3 text-sm font-semibold text-[#9a4d45]">
              {errorMessage}
            </p>
          ) : null}

          <div className="mt-6 grid grid-cols-[1fr_auto] gap-3">
            <SoftButton
              type="button"
              disabled={!selectedSlot || createMutation.isPending}
              onClick={() => createMutation.mutate()}
              className="h-12"
            >
              {createMutation.isPending ? 'Confirmando...' : 'Confirmar'}
            </SoftButton>
            <GhostButton type="button" onClick={() => setSelectedSlot(null)}>
              <Clock3 size={18} />
            </GhostButton>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-[#f8fbf9] p-4 text-sm font-semibold text-[#61736c]">
            <WalletCards size={18} className="text-[#2f7d67]" />
            Pagamento realizado diretamente na unidade.
          </div>
        </aside>
      </div>
    </>
  );
}

function tomorrow(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date;
}
