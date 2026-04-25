'use client';

import { useMutation } from '@tanstack/react-query';
import { ArrowRight, HeartPulse, LockKeyhole, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { SoftButton } from '@/components/app-shell';
import { api, ApiError } from '@/lib/api';
import { persistSession } from '@/lib/auth-storage';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loginMutation = useMutation({
    mutationFn: () => api.login(email, password),
    onSuccess: (session) => {
      persistSession(session);
      router.replace('/exams');
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loginMutation.mutate();
  }

  const errorMessage =
    loginMutation.error instanceof ApiError
      ? loginMutation.error.message
      : loginMutation.error
        ? 'Não foi possível entrar agora. Tente novamente.'
        : null;

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
                Rede integrada de laboratórios
              </p>
              <h1 className="max-w-xl text-5xl font-black leading-[1.02] tracking-tight">
                Um jeito mais calmo de cuidar da sua rotina de exames.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-white/72">
                Busque exames, acompanhe sua agenda e mantenha suas próximas coletas
                organizadas em um só lugar.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                ['10+', 'exames disponíveis'],
                ['5 min', 'cache Redis'],
                ['JWT', 'acesso seguro'],
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
              Acesso seguro
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-[#173a31]">
              Bem-vindo de volta
            </h2>
            <p className="mt-4 text-base leading-7 text-[#66756f]">
              Entre para continuar seus agendamentos e consultar exames disponíveis na rede.
            </p>
          </div>

          <form onSubmit={submit} className="mt-10 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-[#2d4a41]">E-mail</span>
              <span className="flex h-14 items-center gap-3 rounded-2xl border border-[#dbe6e0] bg-[#f9fbfa] px-4 transition focus-within:border-[#2f7d67]">
                <Mail size={18} className="text-[#7a8983]" />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="email"
                  className="h-full min-w-0 flex-1 bg-transparent text-[#18352d] placeholder:text-[#9aa8a2]"
                  placeholder="seu@email.com"
                  required
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-[#2d4a41]">Senha</span>
              <span className="flex h-14 items-center gap-3 rounded-2xl border border-[#dbe6e0] bg-[#f9fbfa] px-4 transition focus-within:border-[#2f7d67]">
                <LockKeyhole size={18} className="text-[#7a8983]" />
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  autoComplete="current-password"
                  className="h-full min-w-0 flex-1 bg-transparent text-[#18352d] placeholder:text-[#9aa8a2]"
                  placeholder="Sua senha"
                  required
                  minLength={8}
                />
              </span>
            </label>

            {errorMessage ? (
              <p role="alert" className="rounded-2xl bg-[#fff1ef] px-4 py-3 text-sm font-semibold text-[#9a4d45]">
                {errorMessage}
              </p>
            ) : null}

            <SoftButton
              type="submit"
              disabled={loginMutation.isPending}
              className="h-14 w-full rounded-[20px]"
            >
              {loginMutation.isPending ? 'Entrando...' : 'Entrar no portal'}
              <ArrowRight size={18} />
            </SoftButton>
          </form>
        </section>
      </div>
    </main>
  );
}
