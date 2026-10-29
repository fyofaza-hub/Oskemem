import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { uid } from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/Button";

type ToastVariant = "success" | "error" | "info";

interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface ToastItem extends ToastInput {
  id: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (input: ToastInput) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const iconByVariant: Record<ToastVariant, { name: "check" | "alert" | "info"; className: string }> = {
  success: { name: "check", className: "bg-accent-soft text-accent-ink" },
  error: { name: "alert", className: "bg-danger-soft text-danger-ink" },
  info: { name: "info", className: "bg-sunken text-muted" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = uid("toast");
      const item: ToastItem = { ...input, id, variant: input.variant ?? "success" };
      setToasts((items) => [...items.slice(-2), item]);
      window.setTimeout(() => {
        setToasts((items) => items.filter((entry) => entry.id !== id));
      }, input.duration ?? 4000);
      return id;
    },
    [],
  );

  useEffect(() => {
    const handleStorageError = () => {
      toast({
        title: tr("Хранилище заполнено"),
        description: tr("Не удалось сохранить изменения. Попробуйте загрузить изображение меньшего размера."),
        variant: "error",
      });
    };
    window.addEventListener("oskemen:storage-error", handleStorageError);
    return () => window.removeEventListener("oskemen:storage-error", handleStorageError);
  }, [toast]);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[120] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:left-auto lg:right-6 lg:items-end lg:px-0">
        <AnimatePresence initial={false}>
          {toasts.map((item) => {
            const look = iconByVariant[item.variant];
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-auto w-full max-w-sm rounded-2xl border border-line bg-surface p-4 shadow-raised"
                role={item.variant === "error" ? "alert" : "status"}
              >
                <div className="flex items-start gap-3">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${look.className}`}>
                    <Icon name={look.name} size={16} />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm font-semibold leading-snug text-fg">{item.title}</p>
                    {item.description ? (
                      <p className="mt-0.5 text-meta text-muted">{item.description}</p>
                    ) : null}
                    {item.action ? (
                      <button
                        type="button"
                        onClick={() => {
                          item.action?.onClick();
                          dismiss(item.id);
                        }}
                        className="mt-2 text-sm font-medium text-accent-ink hover:underline"
                      >
                        {item.action.label}
                      </button>
                    ) : null}
                  </div>
                  <IconButton
                    icon="close"
                    label={tr("Закрыть уведомление")}
                    size="sm"
                    className="-mr-1 -mt-1"
                    onClick={() => dismiss(item.id)}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};
