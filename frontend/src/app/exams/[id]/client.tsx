'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  Loader2,
  MapPin,
  WalletCards,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  AppShell,
  DetailRow,
  GhostButton,
  PortalHeader,
  SoftButton,
} from '@/components/app-shell';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useNotifications } from '@/components/ui/notification-provider';
import { api, ApiError } from '@/lib/api';
import { formatCurrency, toDateInputValue } from '@/lib/formatters';
import type { ExamDetails, Slot } from '@/lib/types';
import { cn } from '@/lib/utils';

export function ExamDetailsClient() {
  return (
    <AppShell>
      <ExamDetailsContent />
    </AppShell>
  );
}

export function ExamScheduleClient() {
  return (
    <AppShell>
      <ExamScheduleContent />
    </AppShell>
  );
}

function ExamDetailsContent() {
  const params = useParams<{ id: string }>();
  const examQuery = useExamQuery(params.id);
  const exam = examQuery.data;

  return (
    <>
      <PortalHeader
        eyebrow="Detalhe do exame"
        title={exam?.name ?? 'Carregando exame'}
        description={
          exam?.description ?? 'Estamos buscando as informações mais recentes deste exame.'
        }
        action={
          <div className="flex flex-wrap gap-3">
            <BackToExamsLink />
            <Link
              href={`/exams/${params.id}/schedule`}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#2f7d67] px-5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(47,125,103,0.22)] transition hover:bg-[#276b58]"
            >
              Agendar exame
              <CalendarCheck size={17} />
            </Link>
          </div>
        }
      />

      {examQuery.isLoading || !exam ? (
        <div className="h-[520px] animate-pulse rounded-[32px] bg-white/80" />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <main className="space-y-5">
            <section className="rounded-[32px] border border-[#dfe8e2] bg-white p-6 shadow-[0_18px_60px_rgba(44,75,66,0.08)]">
              <div className="grid gap-4 md:grid-cols-3">
                <DetailRow label="Valor" value={formatCurrency(exam.priceCents)} />
                <DetailRow label="Duração" value={`${exam.durationInMinutes} minutos`} />
                <DetailRow label="Unidade" value="Rede A&Eight" />
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <article className="rounded-[32px] border border-[#dfe8e2] bg-white p-7 shadow-[0_18px_60px_rgba(44,75,66,0.08)]">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eef6f2] text-[#2f7d67]">
                  <FileText size={23} />
                </span>
                <h2 className="mt-5 text-xl font-black text-[#18352d]">Sobre o exame</h2>
                <p className="mt-4 text-base leading-8 text-[#63736d]">
                  {exam.description}
                </p>
              </article>

              <article className="rounded-[32px] border border-[#f3e5cd] bg-[#fff8eb] p-7 shadow-[0_18px_60px_rgba(135,99,49,0.07)]">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#9a7332]">
                  <CheckCircle2 size={23} />
                </span>
                <h2 className="mt-5 text-xl font-black text-[#4d3a1c]">Preparo</h2>
                <p className="mt-4 text-base leading-8 text-[#786343]">
                  {exam.preparationInstructions ?? 'Sem preparo especial cadastrado.'}
                </p>
              </article>
            </section>

            <section className="rounded-[32px] border border-[#dfe8e2] bg-white p-7 shadow-[0_18px_60px_rgba(44,75,66,0.08)]">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eef6f2] text-[#2f7d67]">
                  <ClipboardCheck size={23} />
                </span>
                <div>
                  <h2 className="text-xl font-black text-[#18352d]">Como funciona</h2>
                  <p className="text-sm font-semibold text-[#7a8983]">
                    Uma jornada simples para chegar preparado ao laboratório.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {[
                  ['1', 'Escolha o horário', 'Agende pela data que melhor encaixa na sua rotina.'],
                  ['2', 'Compareça à unidade', 'Leve documento com foto e siga o preparo indicado.'],
                  ['3', 'Acompanhe sua agenda', 'O exame fica salvo na sua área de agendamentos.'],
                ].map(([step, title, description]) => (
                  <article key={step} className="rounded-[24px] bg-[#f8fbf9] p-5">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-[#2f7d67] text-sm font-black text-white">
                      {step}
                    </span>
                    <h3 className="mt-4 text-base font-black text-[#18352d]">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#6f8279]">{description}</p>
                  </article>
                ))}
              </div>
            </section>
          </main>

          <aside className="space-y-5 xl:sticky xl:top-28 xl:self-start">
            <ExamSummaryCard exam={exam} />
            <section className="rounded-[32px] border border-[#dfe8e2] bg-white p-6 shadow-[0_18px_60px_rgba(44,75,66,0.08)]">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eef6f2] text-[#2f7d67]">
                  <MapPin size={21} />
                </span>
                <div>
                  <h2 className="text-lg font-black text-[#18352d]">Atendimento</h2>
                  <p className="text-sm font-semibold text-[#7a8983]">Rede A&Eight Labs</p>
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm font-semibold leading-6 text-[#61736c]">
                <p>Confirmação imediata após escolher um horário disponível.</p>
                <p>Pagamento realizado diretamente na unidade no dia do atendimento.</p>
              </div>
            </section>
          </aside>
        </div>
      )}
    </>
  );
}

function ExamScheduleContent() {
  const params = useParams<{ id: string }>();
  const examQuery = useExamQuery(params.id);
  const exam = examQuery.data;

  return (
    <>
      <PortalHeader
        eyebrow="Agendamento"
        title={exam?.name ?? 'Agendar exame'}
        description="Escolha uma data, selecione um horário disponível e confirme seu agendamento."
        action={
          <Link
            href={`/exams/${params.id}`}
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[#dbe7e1] bg-white px-5 text-sm font-bold text-[#315348]"
          >
            <ArrowLeft size={17} />
            Voltar aos detalhes
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.75fr)_minmax(520px,1.25fr)]">
        <section className="space-y-5">
          {examQuery.isLoading || !exam ? (
            <div className="h-96 animate-pulse rounded-[32px] bg-white/80" />
          ) : (
            <>
              <ExamSummaryCard exam={exam} showScheduleAction={false} />
              <section className="rounded-[32px] border border-[#dfe8e2] bg-white p-6 shadow-[0_18px_60px_rgba(44,75,66,0.08)]">
                <h2 className="text-lg font-black text-[#18352d]">Preparo</h2>
                <p className="mt-3 text-sm leading-7 text-[#63736d]">
                  {exam.preparationInstructions ?? 'Sem preparo especial cadastrado.'}
                </p>
              </section>
            </>
          )}
        </section>

        <SchedulePanel examId={params.id} />
      </div>
    </>
  );
}

function SchedulePanel({ examId }: { examId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { notify } = useNotifications();
  const [date, setDate] = useState(() => toDateInputValue(tomorrow()));
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const quickDates = useMemo(() => buildQuickDates(), []);

  const slotsQuery = useQuery({
    queryKey: ['slots', examId, date],
    queryFn: () => api.getAvailableSlots(examId, date),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createAppointment({
        examId,
        scheduledAt: selectedSlot ?? '',
        notes: notes.trim() || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      setConfirmOpen(false);
      notify({
        type: 'success',
        title: 'Agendamento confirmado',
        description: selectedSlotTime
          ? `${selectedDateLabel}, às ${selectedSlotTime}.`
          : 'Seu horário foi confirmado com sucesso.',
      });
      router.push('/appointments');
    },
    onError: () => {
      setConfirmOpen(false);
      notify({
        type: 'error',
        title: 'Agendamento não realizado',
        description: 'Não foi possível confirmar este horário agora. Tente novamente.',
      });
    },
  });

  const groupedSlots = useMemo(
    () => groupSlotsByPeriod(slotsQuery.data?.slots ?? []),
    [slotsQuery.data?.slots],
  );
  const selectedSlotTime = selectedSlot ? formatSlotTime(selectedSlot) : null;
  const selectedDateLabel = formatSelectedDate(date);
  const errorMessage =
    createMutation.error instanceof ApiError
      ? createMutation.error.message
      : createMutation.error
        ? 'Não foi possível criar o agendamento.'
        : null;

  function selectDate(value: string) {
    setDate(value);
    setSelectedSlot(null);
  }

  return (
    <section className="rounded-[32px] border border-[#dfe8e2] bg-white p-6 shadow-[0_18px_60px_rgba(44,75,66,0.08)]">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eef6f2] text-[#2f7d67]">
          <CalendarCheck size={22} />
        </span>
        <div>
          <h2 className="text-xl font-black text-[#18352d]">Agendar</h2>
          <p className="text-sm font-semibold text-[#7a8983]">
            Escolha um horário disponível
          </p>
        </div>
      </div>

      <section className="mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-[#315348]">Data</p>
            <p className="mt-1 max-w-xs text-xs font-semibold leading-5 text-[#7a8983]">
              Escolha um dia próximo ou use o calendário
            </p>
          </div>
          <input
            value={date}
            onChange={(event) => selectDate(event.target.value)}
            type="date"
            aria-label="Escolher data do exame"
            className="h-11 w-full rounded-2xl border border-[#dbe7e1] bg-[#f8fbf9] px-3 text-sm font-bold text-[#18352d] sm:w-[170px]"
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-3 2xl:grid-cols-5">
          {quickDates.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => selectDate(option.value)}
              className={cn(
                'rounded-2xl border px-3 py-3 text-left transition',
                date === option.value
                  ? 'border-[#2f7d67] bg-[#2f7d67] text-white shadow-[0_12px_28px_rgba(47,125,103,0.22)]'
                  : 'border-[#dbe7e1] bg-[#f8fbf9] text-[#315348] hover:border-[#9fc5b5]',
              )}
            >
              <span className="block text-[11px] font-black uppercase tracking-[0.14em] opacity-70">
                {option.weekday}
              </span>
              <span className="mt-1 block text-sm font-black">{option.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#315348]">Horários</p>
            <p className="mt-1 text-xs font-semibold text-[#7a8983]">
              {selectedDateLabel}
            </p>
          </div>
          {slotsQuery.isFetching ? (
            <Loader2 className="animate-spin text-[#2f7d67]" size={18} />
          ) : null}
        </div>

        <div className="mt-3 rounded-[26px] border border-[#e1ebe5] bg-[#f8fbf9] p-3">
          {slotsQuery.isLoading ? (
            <div className="flex h-36 items-center justify-center text-[#6f8279]">
              <Loader2 className="animate-spin" size={22} />
            </div>
          ) : slotsQuery.isError ? (
            <p className="rounded-2xl bg-[#fff1ef] px-4 py-3 text-sm font-semibold text-[#9a4d45]">
              Não foi possível carregar os horários deste dia.
            </p>
          ) : groupedSlots.every((group) => group.slots.length === 0) ? (
            <p className="rounded-2xl bg-white px-4 py-5 text-center text-sm font-semibold text-[#6f8279]">
              Nenhum horário disponível para esta data.
            </p>
          ) : (
            <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
              {groupedSlots.map((group) =>
                group.slots.length > 0 ? (
                  <div key={group.period} className="rounded-[22px] bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-[#18352d]">
                          {group.label}
                        </p>
                        <p className="text-xs font-semibold text-[#7a8983]">
                          {group.hint}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#edf5f1] px-3 py-1 text-[11px] font-black text-[#2f7d67]">
                        {group.availableCount} livres
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {group.slots.map((slot) => (
                        <button
                          key={slot.startsAt}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedSlot(slot.startsAt)}
                          className={cn(
                            'h-10 min-w-[72px] rounded-full border px-3 text-sm font-black transition',
                            selectedSlot === slot.startsAt
                              ? 'border-[#2f7d67] bg-[#2f7d67] text-white shadow-[0_10px_24px_rgba(47,125,103,0.2)]'
                              : 'border-[#dbe7e1] bg-[#fbfdfc] text-[#315348] hover:border-[#9fc5b5] hover:bg-white',
                            !slot.available &&
                              'cursor-not-allowed border-[#e4e9e6] bg-[#f0f3f1] text-[#a0aaa5] line-through shadow-none',
                          )}
                        >
                          {formatSlotTime(slot.startsAt)}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null,
              )}
            </div>
          )}
        </div>
      </section>

      <div
        className={cn(
          'mt-5 rounded-[24px] border p-4 transition',
          selectedSlot
            ? 'border-[#b7d8ca] bg-[#edf7f2]'
            : 'border-[#e1ebe5] bg-[#f8fbf9]',
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl',
              selectedSlot ? 'bg-[#2f7d67] text-white' : 'bg-white text-[#7a8983]',
            )}
          >
            <Clock3 size={18} />
          </span>
          <div>
            <p className="text-sm font-black text-[#18352d]">
              {selectedSlotTime
                ? `${selectedDateLabel}, às ${selectedSlotTime}`
                : 'Selecione um horário'}
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-[#6f8279]">
              {selectedSlotTime
                ? 'Seu horário ficará reservado após a confirmação.'
                : 'Toque em um horário disponível para revisar antes de confirmar.'}
            </p>
          </div>
        </div>
      </div>

      <label className="mt-5 block">
        <span className="mb-2 block text-sm font-bold text-[#315348]">Observações</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={4}
          maxLength={500}
          className="w-full resize-none rounded-2xl border border-[#dbe7e1] bg-[#f8fbf9] px-4 py-3 text-sm font-semibold text-[#18352d]"
          placeholder="Preferências ou informações para a unidade"
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
          onClick={() => setConfirmOpen(true)}
          className="h-12"
        >
          {createMutation.isPending ? 'Confirmando...' : 'Confirmar'}
        </SoftButton>
        <GhostButton
          type="button"
          aria-label="Limpar seleção de horário"
          onClick={() => setSelectedSlot(null)}
          disabled={!selectedSlot}
        >
          <Clock3 size={18} />
        </GhostButton>
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-[#f8fbf9] p-4 text-sm font-semibold text-[#61736c]">
        <WalletCards size={18} className="text-[#2f7d67]" />
        Pagamento realizado diretamente na unidade.
      </div>

      <ConfirmDialog
        open={confirmOpen}
        pending={createMutation.isPending}
        title="Confirmar agendamento?"
        description="Revise a data e o horário antes de reservar este exame na sua agenda."
        confirmLabel="Confirmar agendamento"
        cancelLabel="Revisar horário"
        onCancel={() => {
          if (!createMutation.isPending) setConfirmOpen(false);
        }}
        onConfirm={() => createMutation.mutate()}
        details={
          selectedSlotTime ? (
            <div>
              <p className="text-sm font-black text-[#18352d]">{selectedDateLabel}</p>
              <p className="mt-1 text-sm font-semibold text-[#6f8279]">
                Horário selecionado: {selectedSlotTime}
              </p>
              {notes.trim() ? (
                <p className="mt-3 text-sm font-semibold leading-6 text-[#6f8279]">
                  Observações: {notes.trim()}
                </p>
              ) : null}
            </div>
          ) : null
        }
      />
    </section>
  );
}

function useExamQuery(id: string) {
  return useQuery({
    queryKey: ['exam', id],
    queryFn: () => api.getExam(id),
  });
}

function BackToExamsLink() {
  return (
    <Link
      href="/exams"
      className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[#dbe7e1] bg-white px-5 text-sm font-bold text-[#315348]"
    >
      <ArrowLeft size={17} />
      Voltar
    </Link>
  );
}

function ExamSummaryCard({
  exam,
  showScheduleAction = true,
}: {
  exam: ExamDetails;
  showScheduleAction?: boolean;
}) {
  return (
    <section className="rounded-[32px] border border-[#dfe8e2] bg-white p-6 shadow-[0_18px_60px_rgba(44,75,66,0.08)]">
      <h2 className="text-lg font-black text-[#18352d]">Resumo</h2>
      <div className="mt-5 space-y-3">
        <DetailRow label="Valor" value={formatCurrency(exam.priceCents)} />
        <DetailRow label="Duração" value={`${exam.durationInMinutes} minutos`} />
        <DetailRow label="Unidade" value="Rede A&Eight" />
      </div>
      {showScheduleAction ? (
        <Link
          href={`/exams/${exam.id}/schedule`}
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#2f7d67] px-5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(47,125,103,0.22)] transition hover:bg-[#276b58]"
        >
          Agendar exame
          <ArrowRight size={17} />
        </Link>
      ) : null}
    </section>
  );
}

function tomorrow(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date;
}

function buildQuickDates() {
  const start = tomorrow();

  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const value = toDateInputValue(date);
    const parsedDate = parseDateInput(value);

    return {
      value,
      weekday: new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
        .format(parsedDate)
        .replace('.', ''),
      label:
        index === 0
          ? 'Amanhã'
          : new Intl.DateTimeFormat('pt-BR', {
              day: '2-digit',
              month: 'short',
            })
              .format(parsedDate)
              .replace('.', ''),
    };
  });
}

function groupSlotsByPeriod(slots: Slot[]) {
  const periods = [
    { period: 'morning', label: 'Manhã', hint: 'Antes do almoço', slots: [] as Slot[] },
    { period: 'afternoon', label: 'Tarde', hint: 'Após o almoço', slots: [] as Slot[] },
    { period: 'evening', label: 'Noite', hint: 'Fim do dia', slots: [] as Slot[] },
  ];

  for (const slot of slots) {
    const hour = new Date(slot.startsAt).getUTCHours();
    const periodIndex = hour < 12 ? 0 : hour < 18 ? 1 : 2;
    periods[periodIndex].slots.push(slot);
  }

  return periods.map((period) => ({
    ...period,
    availableCount: period.slots.filter((slot) => slot.available).length,
  }));
}

function formatSlotTime(value: string): string {
  return new Date(value).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}

function formatSelectedDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(parseDateInput(value));
}

function parseDateInput(value: string): Date {
  return new Date(`${value}T12:00:00`);
}
