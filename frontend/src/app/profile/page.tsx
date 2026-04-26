'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  Pencil,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  AppShell,
  GhostButton,
  PortalHeader,
  SoftButton,
  StatPill,
} from '@/components/app-shell';
import { FormField, FormInput, PasswordInput } from '@/components/ui/form-field';
import { useNotifications } from '@/components/ui/notification-provider';
import { useZodForm } from '@/hooks/use-zod-form';
import { api, ApiError } from '@/lib/api';
import { formatDate, formatDateTime } from '@/lib/formatters';
import { updateProfileSchema } from '@/lib/schemas';

export default function ProfilePage() {
  return (
    <AppShell>
      <ProfileContent />
    </AppShell>
  );
}

function ProfileContent() {
  const queryClient = useQueryClient();
  const { notify } = useNotifications();
  const [editing, setEditing] = useState(false);

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: api.getProfile,
  });

  useEffect(() => {
    if (!profileQuery.isError) return;
    notify({
      type: 'error',
      title: 'Não foi possível carregar seu perfil',
      description:
        profileQuery.error instanceof ApiError
          ? profileQuery.error.message
          : 'Tente novamente em instantes.',
    });
  }, [profileQuery.isError, profileQuery.error, notify]);

  const profile = profileQuery.data;

  return (
    <>
      <PortalHeader
        eyebrow="Perfil do paciente"
        title={profile?.name ?? 'Sua conta'}
        description="Dados da conta, histórico resumido e próximo compromisso dentro da rede A&Eight Labs."
        action={
          !editing ? (
            <GhostButton type="button" onClick={() => setEditing(true)}>
              <Pencil size={16} />
              Editar perfil
            </GhostButton>
          ) : undefined
        }
      />

      {profileQuery.isLoading || !profile ? (
        <div className="h-[520px] animate-pulse rounded-[34px] bg-white/70" />
      ) : editing ? (
        <EditProfileForm
          profile={profile}
          onCancel={() => setEditing(false)}
          onSuccess={() => {
            setEditing(false);
            void queryClient.invalidateQueries({ queryKey: ['profile'] });
          }}
        />
      ) : (
        <ProfileView profile={profile} />
      )}
    </>
  );
}

type Profile = {
  id: string;
  name: string;
  email: string;
  memberSince: string;
  stats: {
    totalAppointments: number;
    upcomingAppointments: number;
    completedAppointments: number;
  };
  nextAppointment: {
    id: string;
    scheduledAt: string;
    exam: { id: string; name: string };
  } | null;
};

function ProfileView({ profile }: { profile: Profile }) {
  return (
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
            <h3 className="mt-4 text-lg font-black text-[#4d3a1c]">Próximo compromisso</h3>
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
  );
}

function EditProfileForm({
  profile,
  onCancel,
  onSuccess,
}: {
  profile: Profile;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const { notify } = useNotifications();
  const form = useZodForm(updateProfileSchema, {
    name: profile.name,
    email: profile.email,
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      const payload: {
        name?: string;
        email?: string;
        currentPassword?: string;
        newPassword?: string;
      } = {};
      if (form.values.name && form.values.name !== profile.name) payload.name = form.values.name;
      if (form.values.email && form.values.email !== profile.email)
        payload.email = form.values.email;
      if (form.values.currentPassword) {
        payload.currentPassword = form.values.currentPassword;
        payload.newPassword = form.values.newPassword;
      }
      return api.updateProfile(payload);
    },
    onSuccess: () => {
      notify({
        type: 'success',
        title: 'Perfil atualizado',
        description: 'Suas informações foram salvas com sucesso.',
      });
      onSuccess();
    },
    onError: (error) => {
      notify({
        type: 'error',
        title: 'Perfil não atualizado',
        description:
          error instanceof ApiError
            ? error.message
            : 'Revise os dados informados e tente novamente.',
      });
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const data = form.validate();
    if (!data) return;
    updateMutation.mutate();
  }

  return (
    <div className="rounded-[34px] border border-[#dfe8e2] bg-white p-6 shadow-[0_18px_60px_rgba(44,75,66,0.08)]">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-black text-[#18352d]">Editar perfil</h2>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full p-2 text-[#63736d] hover:bg-[#f2f6f3]"
          aria-label="Cancelar edição"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <FormField label="Nome completo" error={form.errors.name}>
            <FormInput
              type="text"
              autoComplete="name"
              value={form.values.name}
              onChange={(e) => form.setValue('name', e.target.value)}
              error={!!form.errors.name}
            />
          </FormField>

          <FormField label="E-mail" error={form.errors.email}>
            <FormInput
              icon={<Mail size={18} />}
              type="email"
              autoComplete="email"
              value={form.values.email}
              onChange={(e) => form.setValue('email', e.target.value)}
              error={!!form.errors.email}
            />
          </FormField>
        </div>

        <div className="rounded-[24px] border border-[#e2ece5] bg-[#f8fbf9] p-5">
          <p className="mb-4 text-sm font-bold text-[#315348]">
            Trocar senha{' '}
            <span className="font-normal text-[#6d7c76]">(opcional)</span>
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <FormField label="Senha atual" error={form.errors.currentPassword}>
              <PasswordInput
                autoComplete="current-password"
                placeholder="Senha atual"
                value={form.values.currentPassword}
                onChange={(e) => form.setValue('currentPassword', e.target.value)}
                error={!!form.errors.currentPassword}
              />
            </FormField>

            <FormField label="Nova senha" error={form.errors.newPassword}>
              <PasswordInput
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                value={form.values.newPassword}
                onChange={(e) => form.setValue('newPassword', e.target.value)}
                error={!!form.errors.newPassword}
              />
            </FormField>

            <FormField label="Confirmar nova senha" error={form.errors.confirmNewPassword}>
              <PasswordInput
                autoComplete="new-password"
                placeholder="Repita a nova senha"
                value={form.values.confirmNewPassword}
                onChange={(e) => form.setValue('confirmNewPassword', e.target.value)}
                error={!!form.errors.confirmNewPassword}
              />
            </FormField>
          </div>
        </div>

        <div className="flex gap-3">
          <SoftButton type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
          </SoftButton>
          <GhostButton type="button" onClick={onCancel}>
            Cancelar
          </GhostButton>
        </div>
      </form>
    </div>
  );
}
