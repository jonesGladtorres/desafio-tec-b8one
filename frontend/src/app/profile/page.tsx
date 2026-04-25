'use client';

import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import {
  AppShell,
  PortalHeader,
  SoftButton,
  StatPill,
} from '@/components/app-shell';
import { api } from '@/lib/api';
import { formatDate, formatDateTime } from '@/lib/formatters';

export default function ProfilePage() {
  return (
    <AppShell>
      <ProfileContent />
    </AppShell>
  );
}

function ProfileContent() {
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: api.getProfile,
  });

  const profile = profileQuery.data;

  return (
    <>
      <PortalHeader
        eyebrow="Perfil do paciente"
        title={profile?.name ?? 'Sua conta'}
        description="Dados da conta, histórico resumido e próximo compromisso dentro da rede A&Eight Labs."
      />

      {profileQuery.isLoading || !profile ? (
        <div className="h-[520px] animate-pulse rounded-[34px] bg-white/70" />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <section className="rounded-[34px] border border-[#dfe8e2] bg-white p-6 shadow-[0_18px_60px_rgba(44,75,66,0.08)]">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div
                className="grid h-24 w-24 place-items-center rounded-[30px] bg-[#2f7d67] text-4xl font-black text-white"
                aria-hidden="true"
              >
                {profile.name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#7a8983]">
                  Conta verificada
                </p>
                <h2 className="mt-2 text-3xl font-black text-[#18352d]">{profile.name}</h2>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#66756f]">
                  <Mail size={16} />
                  {profile.email}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <StatPill
                label="Total"
                value={String(profile.stats.totalAppointments)}
                icon={<CalendarDays size={20} />}
              />
              <StatPill
                label="Próximos"
                value={String(profile.stats.upcomingAppointments)}
                icon={<Clock3 size={20} />}
              />
              <StatPill
                label="Realizados"
                value={String(profile.stats.completedAppointments)}
                icon={<CheckCircle2 size={20} />}
              />
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-[28px] bg-[#f7faf8] p-6">
                <ShieldCheck className="text-[#2f7d67]" size={24} />
                <h3 className="mt-4 text-lg font-black text-[#18352d]">Membro desde</h3>
                <p className="mt-2 text-sm font-semibold text-[#66756f]">
                  {formatDate(profile.memberSince)}
                </p>
              </div>

              <div className="rounded-[28px] bg-[#fff8eb] p-6">
                <CalendarDays className="text-[#9a7332]" size={24} />
                <h3 className="mt-4 text-lg font-black text-[#4d3a1c]">
                  Próximo compromisso
                </h3>
                <p className="mt-2 text-sm font-semibold text-[#786343]">
                  {profile.nextAppointment
                    ? `${profile.nextAppointment.exam.name} · ${formatDateTime(profile.nextAppointment.scheduledAt)}`
                    : 'Nenhum agendamento futuro'}
                </p>
              </div>
            </div>
          </section>

          <aside className="rounded-[34px] border border-[#dfe8e2] bg-[#173a31] p-6 text-white shadow-[0_18px_60px_rgba(44,75,66,0.12)]">
            <UserRound size={28} className="text-[#aee3cf]" />
            <h2 className="mt-5 text-2xl font-black">Resumo do cuidado</h2>
            <p className="mt-3 text-sm leading-7 text-white/70">
              Sua conta está pronta para novos agendamentos, com histórico e próximos
              compromissos centralizados no portal.
            </p>
            <Link href="/exams" className="mt-8 block">
              <SoftButton
                type="button"
                className="w-full bg-white text-[#173a31] hover:bg-[#ecf5ef]"
              >
                Buscar exames
              </SoftButton>
            </Link>
          </aside>
        </div>
      )}
    </>
  );
}
