'use client';

import { useMutation } from '@tanstack/react-query';
import { ArrowRight, HeartPulse, Mail, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent } from 'react';
import { SoftButton } from '@/components/app-shell';
import { FormField, FormInput, PasswordInput } from '@/components/ui/form-field';
import { useNotifications } from '@/components/ui/notification-provider';
import { useZodForm } from '@/hooks/use-zod-form';
import { api, ApiError } from '@/lib/api';
import { persistSession } from '@/lib/auth-storage';
import { registerSchema } from '@/lib/schemas';

export default function RegisterPage() {
  const router = useRouter();
  const { notify } = useNotifications();
  const form = useZodForm(registerSchema, {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const registerMutation = useMutation({
    mutationFn: () =>
      api.register({
        name: form.values.name,
        email: form.values.email,
        password: form.values.password,
      }),
    onSuccess: (session) => {
      persistSession(session);
      notify({
        type: 'success',
        title: 'Conta criada',
        description: `Bem-vindo(a), ${session.user.name.split(' ')[0]}! Já estamos te levando ao catálogo.`,
      });
      router.replace('/exams');
    },
    onError: (error) => {
      notify({
        type: 'error',
        title: 'Não foi possível criar a conta',
        description:
          error instanceof ApiError
            ? error.message
            : 'Confira os dados informados e tente novamente.',
      });
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = form.validate();
    if (!data) return;
    registerMutation.mutate();
  }

  return (
    <main className="soft-grid grid min-h-screen place-items-center bg-[#f6f8f5] px-4 py-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[36px] border border-[#dfe8e2] bg-white shadow-[0_30px_90px_rgba(34,63,54,0.12)] lg:grid-cols-[1.04fr_0.96fr]">
        <section className="relative hidden min-h-[680px] bg-[#173a31] p-10 text-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(143,214,183,0.32),transparent_34%),radial-gradient(circle_at_80%_70%,rgba(242,203,124,0.24),transparent_30%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/12 backdrop-blur">
                <HeartPulse size={24} />
              </span>
              <div>
                <p className="text-sm font-semibold text-white/60">A&Eight Labs</p>
                <p className="text-xl font-black">Portal do Paciente</p>
              </div>
            </div>

            <div>
              <p className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-[#d7efe6]">
                Cadastro gratuito
              </p>
              <h1 className="max-w-xl text-5xl font-black leading-[1.02] tracking-tight">
                Comece a cuidar da sua saúde com mais organização.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-white/72">
                Crie sua conta, agende exames e acompanhe sua agenda de laboratório em um
                só lugar.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                ['10+', 'exames disponíveis'],
                ['JWT', 'acesso seguro'],
                ['Redis', 'cache rápido'],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-[22px] border border-white/12 bg-white/10 p-4 backdrop-blur"
                >
                  <p className="text-2xl font-black">{value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-10 sm:px-12 lg:px-14">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#2f7d67] text-white">
              <HeartPulse size={24} />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#7a8983]">A&Eight Labs</p>
              <p className="text-xl font-black text-[#18352d]">Portal do Paciente</p>
            </div>
          </div>

          <div className="max-w-md">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#7a8983]">
              Novo cadastro
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-[#173a31]">
              Criar conta
            </h2>
            <p className="mt-4 text-base leading-7 text-[#66756f]">
              Preencha os dados abaixo para acessar o portal e agendar exames.
            </p>
          </div>

          <form onSubmit={submit} className="mt-10 space-y-5">
            <FormField label="Nome completo" error={form.errors.name}>
              <FormInput
                icon={<UserRound size={18} />}
                type="text"
                autoComplete="name"
                placeholder="Seu nome completo"
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
                placeholder="seu@email.com"
                value={form.values.email}
                onChange={(e) => form.setValue('email', e.target.value)}
                error={!!form.errors.email}
              />
            </FormField>

            <FormField label="Senha" error={form.errors.password}>
              <PasswordInput
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                value={form.values.password}
                onChange={(e) => form.setValue('password', e.target.value)}
                error={!!form.errors.password}
              />
            </FormField>

            <FormField label="Confirmar senha" error={form.errors.confirmPassword}>
              <PasswordInput
                autoComplete="new-password"
                placeholder="Repita sua senha"
                value={form.values.confirmPassword}
                onChange={(e) => form.setValue('confirmPassword', e.target.value)}
                error={!!form.errors.confirmPassword}
              />
            </FormField>

            <SoftButton
              type="submit"
              disabled={registerMutation.isPending}
              className="h-14 w-full rounded-[20px]"
            >
              {registerMutation.isPending ? 'Criando conta...' : 'Criar minha conta'}
              <ArrowRight size={18} />
            </SoftButton>

            <p className="text-center text-sm text-[#66756f]">
              Já tem conta?{' '}
              <Link href="/login" className="font-bold text-[#2f7d67] hover:underline">
                Entrar
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
