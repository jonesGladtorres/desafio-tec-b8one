'use client';

import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  ClipboardList,
  HeartPulse,
  LogOut,
  Search,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { clearSession, getStoredUser, getToken } from '@/lib/auth-storage';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/exams', label: 'Exames', icon: Search },
  { href: '/appointments', label: 'Agenda', icon: CalendarDays },
  { href: '/profile', label: 'Perfil', icon: UserRound },
];

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const user = ready ? getStoredUser() : null;

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: api.getProfile,
    enabled: ready && Boolean(getToken()),
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!getToken()) {
        router.replace('/login');
        return;
      }

      setReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [router]);

  function logout() {
    clearSession();
    router.replace('/login');
  }

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f6f8f5] text-[#20342f]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d9e7df] border-t-[#2f7d67]" />
      </div>
    );
  }

  const displayName = profileQuery.data?.name ?? user?.name ?? 'Paciente';

  return (
    <div className="min-h-screen bg-[#f6f8f5] text-[#20342f]">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-[#dfe8e2] bg-white/80 px-5 py-6 backdrop-blur lg:block">
          <Link href="/exams" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#2f7d67] text-white shadow-sm">
              <HeartPulse size={22} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-[#6c7b75]">
                A&Eight Labs
              </span>
              <span className="block text-lg font-bold text-[#18352d]">
                Portal do Paciente
              </span>
            </span>
          </Link>

          <div className="mt-8 rounded-[24px] border border-[#e2ece5] bg-[#f8fbf9] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#87958f]">
              Conta ativa
            </p>
            <p className="mt-2 text-lg font-bold text-[#18352d]">{displayName}</p>
            <p className="text-sm text-[#6d7c76]">
              {profileQuery.data?.email ?? user?.email}
            </p>
          </div>

          <nav className="mt-8 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition',
                    active
                      ? 'bg-[#e7f2ed] text-[#1f6f5b]'
                      : 'text-[#63736d] hover:bg-[#f2f6f3] hover:text-[#20342f]',
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={logout}
            className="mt-10 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-[#8b4f4a] transition hover:bg-[#fff1ef]"
          >
            <LogOut size={18} />
            Sair
          </button>
        </aside>

        <main className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-[#dfe8e2] bg-[#f6f8f5]/90 px-4 py-3 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between">
              <Link href="/exams" className="flex items-center gap-2 font-bold">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#2f7d67] text-white">
                  <HeartPulse size={20} />
                </span>
                A&Eight Labs
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-[#dfe8e2] bg-white p-2 text-[#63736d]"
                aria-label="Sair"
              >
                <LogOut size={18} />
              </button>
            </div>
            <nav className="mt-3 grid grid-cols-3 gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold',
                      active
                        ? 'bg-[#2f7d67] text-white'
                        : 'bg-white text-[#63736d]',
                    )}
                  >
                    <Icon size={15} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>

          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function PortalHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#7c8f86]">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#15352d] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[#64746e]">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[28px] border border-dashed border-[#cad8d0] bg-white/70 p-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#edf5f1] text-[#2f7d67]">
        {icon}
      </div>
      <h2 className="mt-5 text-xl font-bold text-[#18352d]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6a7a73]">
        {description}
      </p>
    </div>
  );
}

export function StatPill({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-[#e0eae4] bg-white p-5 shadow-[0_18px_50px_rgba(44,75,66,0.07)]">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eef6f2] text-[#2f7d67]">
          {icon}
        </span>
        <div>
          <p className="text-sm font-semibold text-[#7a8983]">{label}</p>
          <p className="text-2xl font-black text-[#16372e]">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function SoftButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#2f7d67] px-5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(47,125,103,0.22)] transition hover:bg-[#276b58] disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#dbe7e1] bg-white px-5 text-sm font-bold text-[#315348] transition hover:border-[#b7cfc3] hover:bg-[#f8fbf9] disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f7faf8] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8a9993]">
        {label}
      </p>
      <p className="mt-1 font-bold text-[#1f3c33]">{value}</p>
    </div>
  );
}

export { ClipboardList };
