'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock,
  CalendarX2,
  CheckCircle2,
  Clock3,
  ClipboardList,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
  AppShell,
  EmptyState,
  GhostButton,
  PortalHeader,
  StatPill,
} from '@/components/app-shell';
import { api } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/formatters';

const PAGE_SIZE = 6;

export default function AppointmentsPage() {
  return (
    <AppShell>
      <AppointmentsContent />
    </AppShell>
  );
}

function AppointmentsContent() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const appointmentsQuery = useQuery({
    queryKey: ['appointments', page],
    queryFn: () => api.listAppointments({ page, limit: PAGE_SIZE }),
  });

  const cancelMutation = useMutation({
    mutationFn: api.cancelAppointment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const appointments = appointmentsQuery.data?.data ?? [];
  const meta = appointmentsQuery.data?.meta;
  const scheduledCount = appointments.filter(
    (appointment) => appointment.status === 'SCHEDULED',
  ).length;

  return (
    <>
      <PortalHeader
        eyebrow="Minha agenda"
        title="Seus proximos exames"
        description="Acompanhe horarios confirmados, valores e status dos agendamentos feitos no portal."
        action={
          <Link
            href="/exams"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#2f7d67] px-5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(47,125,103,0.22)]"
          >
            Novo agendamento
          </Link>
        }
      />

      <section className="mb-7 grid gap-4 md:grid-cols-3">
        <StatPill
          label="Confirmados"
          value={String(scheduledCount)}
          icon={<CheckCircle2 size={20} />}
        />
        <StatPill
          label="Nesta pagina"
          value={String(appointments.length)}
          icon={<ClipboardList size={20} />}
        />
        <StatPill
          label="Pagina"
          value={meta ? `${meta.page}/${meta.totalPages || 1}` : '1/1'}
          icon={<Clock3 size={20} />}
        />
      </section>

      {appointmentsQuery.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-[30px] bg-white/70"
            />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={<CalendarClock size={24} />}
          title="Nenhum agendamento por aqui"
          description="Quando voce escolher um exame e confirmar um horario, ele aparece nesta agenda."
        />
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <article
              key={appointment.id}
              className="rounded-[30px] border border-[#dfe8e2] bg-white p-5 shadow-[0_18px_60px_rgba(44,75,66,0.08)]"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex gap-4">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#eef6f2] text-[#2f7d67]">
                    <CalendarClock size={24} />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black text-[#18352d]">
                        {appointment.exam.name}
                      </h2>
                      <span className="rounded-full bg-[#eef6f2] px-3 py-1 text-xs font-black text-[#2f7d67]">
                        {appointment.status === 'SCHEDULED'
                          ? 'Confirmado'
                          : 'Cancelado'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-bold text-[#63736d]">
                      {formatDateTime(appointment.scheduledAt)}
                    </p>
                    <p className="mt-1 text-sm text-[#75837d]">
                      {appointment.exam.durationInMinutes} minutos ·{' '}
                      {formatCurrency(appointment.exam.priceCents)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/exams/${appointment.exam.id}`}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#dbe7e1] bg-white px-4 text-sm font-bold text-[#315348]"
                  >
                    Ver exame
                  </Link>
                  {appointment.status === 'SCHEDULED' ? (
                    <GhostButton
                      type="button"
                      disabled={cancelMutation.isPending}
                      onClick={() => cancelMutation.mutate(appointment.id)}
                    >
                      <CalendarX2 size={18} />
                      Cancelar
                    </GhostButton>
                  ) : null}
                </div>
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
            Pagina {meta.page} de {meta.totalPages}
          </p>
          <GhostButton
            type="button"
            disabled={page >= meta.totalPages}
            onClick={() =>
              setPage((current) => Math.min(current + 1, meta.totalPages))
            }
          >
            Proxima
          </GhostButton>
        </div>
      ) : null}

      {cancelMutation.error ? (
        <p className="mt-4 rounded-2xl bg-[#fff1ef] px-4 py-3 text-sm font-semibold text-[#9a4d45]">
          Nao foi possivel cancelar este agendamento.
        </p>
      ) : null}
    </>
  );
}
