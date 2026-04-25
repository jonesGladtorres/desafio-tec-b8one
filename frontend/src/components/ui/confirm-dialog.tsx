'use client';

import { AlertTriangle, X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GhostButton, SoftButton } from '@/components/app-shell';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  details?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Voltar',
  destructive = false,
  pending = false,
  details,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="animate-modal-overlay fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#173a31]/35 px-4 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="animate-modal-panel w-full max-w-lg rounded-[30px] border border-[#dfe8e2] bg-white p-6 shadow-[0_30px_100px_rgba(24,53,45,0.24)] will-change-transform">
        <div className="flex items-start justify-between gap-4">
          <span
            className={
              destructive
                ? 'grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#fff1ef] text-[#9a4d45]'
                : 'grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#eef6f2] text-[#2f7d67]'
            }
          >
            <AlertTriangle size={22} />
          </span>
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-full p-2 text-[#63736d] transition hover:bg-[#f2f6f3] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Fechar confirmação"
          >
            <X size={19} />
          </button>
        </div>

        <h2 id="confirm-dialog-title" className="mt-5 text-2xl font-black text-[#18352d]">
          {title}
        </h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-[#63736d]">
          {description}
        </p>

        {details ? (
          <div className="mt-5 rounded-[22px] border border-[#e2ece5] bg-[#f8fbf9] p-4">
            {details}
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
          <SoftButton
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={
              destructive
                ? 'h-12 bg-[#9a4d45] hover:bg-[#85423b]'
                : 'h-12'
            }
          >
            {pending ? 'Processando...' : confirmLabel}
          </SoftButton>
          <GhostButton type="button" onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </GhostButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}
