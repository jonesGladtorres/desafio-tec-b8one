'use client';

import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { cn } from '@/lib/utils';

type NotificationType = 'success' | 'error' | 'info';

type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
};

type NotifyInput = Omit<Notification, 'id'>;

type NotificationContextValue = {
  notify: (notification: NotifyInput) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

const typeStyles: Record<
  NotificationType,
  { icon: ReactNode; className: string; iconClassName: string }
> = {
  success: {
    icon: <CheckCircle2 size={20} />,
    className: 'border-[#b7d8ca] bg-white text-[#18352d]',
    iconClassName: 'bg-[#e7f2ed] text-[#2f7d67]',
  },
  error: {
    icon: <TriangleAlert size={20} />,
    className: 'border-[#f0cac5] bg-white text-[#4d2724]',
    iconClassName: 'bg-[#fff1ef] text-[#9a4d45]',
  },
  info: {
    icon: <Info size={20} />,
    className: 'border-[#cfded7] bg-white text-[#18352d]',
    iconClassName: 'bg-[#eef6f2] text-[#2f7d67]',
  },
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const remove = useCallback((id: string) => {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== id),
    );
  }, []);

  const notify = useCallback(
    (notification: NotifyInput) => {
      const id = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
      setNotifications((current) => [...current, { id, ...notification }].slice(-4));
      window.setTimeout(() => remove(id), 5200);
    },
    [remove],
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions"
        className="fixed right-4 top-4 z-50 flex w-[min(420px,calc(100vw-2rem))] flex-col gap-3"
      >
        {notifications.map((notification) => {
          const styles = typeStyles[notification.type];

          return (
            <div
              key={notification.id}
              className={cn(
                'animate-toast-lifecycle rounded-[24px] border p-4 shadow-[0_18px_60px_rgba(44,75,66,0.16)] backdrop-blur will-change-transform',
                styles.className,
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'grid h-10 w-10 shrink-0 place-items-center rounded-2xl',
                    styles.iconClassName,
                  )}
                >
                  {styles.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black">{notification.title}</p>
                  {notification.description ? (
                    <p className="mt-1 text-sm font-semibold leading-6 text-[#6f8279]">
                      {notification.description}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => remove(notification.id)}
                  className="rounded-full p-1 text-[#7a8983] transition hover:bg-[#f2f6f3]"
                  aria-label="Fechar notificação"
                >
                  <X size={17} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotifications must be used inside NotificationProvider.');
  }

  return context;
}
