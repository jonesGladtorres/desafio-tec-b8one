'use client';

import { Eye, EyeOff } from 'lucide-react';
import { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes, useState } from 'react';
import { cn } from '@/lib/utils';

type FormFieldProps = {
  label: string;
  error?: string;
  children: ReactNode;
};

export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#2d4a41]">{label}</span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs font-semibold text-[#9a4d45]">{error}</span>
      ) : null}
    </label>
  );
}

type FormInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  icon?: ReactNode;
  error?: boolean;
};

export function FormInput({ icon, error, ...props }: FormInputProps) {
  return (
    <span
      className={cn(
        'flex h-14 items-center gap-3 rounded-2xl border bg-[#f9fbfa] px-4 transition focus-within:border-[#2f7d67]',
        error ? 'border-[#d9736b]' : 'border-[#dbe6e0]',
      )}
    >
      {icon ? <span className="shrink-0 text-[#7a8983]">{icon}</span> : null}
      <input
        {...props}
        className="h-full min-w-0 flex-1 bg-transparent text-[#18352d] placeholder:text-[#9aa8a2] outline-none"
      />
    </span>
  );
}

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> & {
  error?: boolean;
};

export function PasswordInput({ error, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className={cn(
        'flex h-14 items-center gap-3 rounded-2xl border bg-[#f9fbfa] px-4 transition focus-within:border-[#2f7d67]',
        error ? 'border-[#d9736b]' : 'border-[#dbe6e0]',
      )}
    >
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className="h-full min-w-0 flex-1 bg-transparent text-[#18352d] placeholder:text-[#9aa8a2] outline-none"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className="shrink-0 text-[#7a8983] hover:text-[#2f7d67]"
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </span>
  );
}

type FormTextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> & {
  error?: boolean;
};

export function FormTextarea({ error, ...props }: FormTextareaProps) {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full resize-none rounded-2xl border bg-[#f9fbfa] px-4 py-3 text-sm font-semibold text-[#18352d] outline-none transition focus:border-[#2f7d67]',
        error ? 'border-[#d9736b]' : 'border-[#dbe7e1]',
      )}
    />
  );
}

export function ErrorAlert({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-2xl bg-[#fff1ef] px-4 py-3 text-sm font-semibold text-[#9a4d45]">
      {message}
    </p>
  );
}
