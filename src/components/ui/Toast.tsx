"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Loader2, X } from "lucide-react";

export type ToastVariant = "success" | "error" | "warning" | "info" | "loading";

export interface ToastOptions {
  title?: string;
  description?: string | null;
  variant?: ToastVariant;
  /** Milisegundos visibles. 0 = permanece hasta cerrarlo o actualizarlo. */
  duration?: number;
}

interface ToastItem {
  id: string;
  title: string;
  description: string | null;
  variant: ToastVariant;
  closing: boolean;
}

export interface ToastApi {
  show: (options: ToastOptions & { title: string }) => string;
  update: (id: string, options: ToastOptions) => void;
  dismiss: (id: string) => void;
  success: (title: string, options?: ToastOptions) => string;
  error: (title: string, options?: ToastOptions) => string;
  warning: (title: string, options?: ToastOptions) => string;
  info: (title: string, options?: ToastOptions) => string;
  /** Toast persistente para procesos en curso; ciérralo con update() o dismiss(). */
  loading: (title: string, options?: ToastOptions) => string;
}

const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 3500,
  error: 6500,
  warning: 5500,
  info: 4000,
  loading: 0,
};

const VARIANT_STYLE: Record<
  ToastVariant,
  { Icon: typeof CheckCircle2; card: string; icon: string; spin?: boolean }
> = {
  success: { Icon: CheckCircle2, card: "border-emerald-200", icon: "text-emerald-600" },
  error: { Icon: AlertCircle, card: "border-red-200", icon: "text-red-600" },
  warning: { Icon: AlertTriangle, card: "border-amber-200", icon: "text-amber-600" },
  info: { Icon: Info, card: "border-slate-200", icon: "text-orbita-cyan-dark" },
  loading: {
    Icon: Loader2,
    card: "border-slate-200",
    icon: "text-orbita-cyan-dark",
    spin: true,
  },
};

const MAX_VISIBLE = 4;
const EXIT_MS = 180;

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const counter = useRef(0);

  const clearTimer = useCallback((key: string) => {
    const timer = timers.current.get(key);
    if (timer !== undefined) {
      clearTimeout(timer);
      timers.current.delete(key);
    }
  }, []);

  const dismiss = useCallback(
    (id: string) => {
      clearTimer(id);
      clearTimer(`${id}:exit`);
      setToasts((prev) =>
        prev.map((toast) => (toast.id === id ? { ...toast, closing: true } : toast))
      );
      timers.current.set(
        `${id}:exit`,
        setTimeout(() => {
          timers.current.delete(`${id}:exit`);
          setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, EXIT_MS)
      );
    },
    [clearTimer]
  );

  const scheduleDismiss = useCallback(
    (id: string, duration: number) => {
      clearTimer(id);
      if (duration <= 0) return;
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration)
      );
    },
    [clearTimer, dismiss]
  );

  const show = useCallback(
    (options: ToastOptions & { title: string }) => {
      const variant = options.variant ?? "info";
      counter.current += 1;
      const id = `toast-${counter.current}`;
      setToasts((prev) =>
        [
          ...prev,
          {
            id,
            title: options.title,
            description: options.description ?? null,
            variant,
            closing: false,
          },
        ].slice(-MAX_VISIBLE)
      );
      scheduleDismiss(id, options.duration ?? DEFAULT_DURATION[variant]);
      return id;
    },
    [scheduleDismiss]
  );

  const update = useCallback(
    (id: string, options: ToastOptions) => {
      const variant = options.variant;
      setToasts((prev) => {
        const current = prev.find((toast) => toast.id === id);
        if (!current) {
          // El toast ya se había cerrado: lo mostramos de nuevo para no perder el resultado.
          if (!options.title) return prev;
          return [
            ...prev,
            {
              id,
              title: options.title,
              description: options.description ?? null,
              variant: variant ?? "info",
              closing: false,
            },
          ].slice(-MAX_VISIBLE);
        }
        return prev.map((toast) =>
          toast.id === id
            ? {
                ...toast,
                title: options.title ?? toast.title,
                description:
                  options.description === undefined ? toast.description : options.description,
                variant: variant ?? toast.variant,
                closing: false,
              }
            : toast
        );
      });
      clearTimer(`${id}:exit`);
      const duration = options.duration ?? (variant ? DEFAULT_DURATION[variant] : undefined);
      if (duration !== undefined) scheduleDismiss(id, duration);
    },
    [clearTimer, scheduleDismiss]
  );

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      update,
      dismiss,
      success: (title, options) => show({ ...options, title, variant: "success" }),
      error: (title, options) => show({ ...options, title, variant: "error" }),
      warning: (title, options) => show({ ...options, title, variant: "warning" }),
      info: (title, options) => show({ ...options, title, variant: "info" }),
      loading: (title, options) => show({ ...options, title, variant: "loading" }),
    }),
    [show, update, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        aria-label="Notificaciones"
        className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-3 pt-3 sm:inset-x-auto sm:bottom-0 sm:right-0 sm:top-auto sm:items-end sm:p-5"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const { Icon, card, icon, spin } = VARIANT_STYLE[toast.variant];

  return (
    <div
      role={toast.variant === "error" ? "alert" : "status"}
      data-state={toast.closing ? "closing" : "open"}
      className={`toast-item pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-2xl border bg-white px-3.5 py-3 shadow-[0_18px_45px_-20px_rgba(3,27,45,0.5)] ${card}`}
    >
      <Icon
        size={18}
        aria-hidden="true"
        className={`mt-0.5 shrink-0 ${icon} ${spin ? "animate-spin" : ""}`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-5 text-slate-900">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 break-words text-xs leading-5 text-slate-500">
            {toast.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Cerrar notificación"
        className="-mr-1 -mt-1 shrink-0 rounded-lg p-1 text-slate-300 transition hover:bg-slate-100 hover:text-slate-600"
      >
        <X size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast debe usarse dentro de un ToastProvider");
  return context;
}
