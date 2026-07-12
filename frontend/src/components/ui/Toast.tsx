import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={18} className="text-emerald-400" />,
  error: <AlertCircle size={18} className="text-red-400" />,
  info: <Info size={18} className="text-blue-400" />,
  warning: <AlertTriangle size={18} className="text-amber-400" />,
};

const bgMap: Record<ToastType, string> = {
  success: "border-emerald-500/20 bg-emerald-500/10",
  error: "border-red-500/20 bg-red-500/10",
  info: "border-blue-500/20 bg-blue-500/10",
  warning: "border-amber-500/20 bg-amber-500/10",
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = React.useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = Date.now().toString();
      const newToast: Toast = { ...toast, id, duration: toast.duration ?? 4000 };
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => removeToast(id), newToast.duration);
    },
    [removeToast]
  );

  const success = (title: string, message?: string) =>
    addToast({ type: "success", title, message });
  const error = (title: string, message?: string) =>
    addToast({ type: "error", title, message });
  const info = (title: string, message?: string) =>
    addToast({ type: "info", title, message });
  const warning = (title: string, message?: string) =>
    addToast({ type: "warning", title, message });

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, info, warning }}
    >
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 backdrop-blur-xl shadow-lg",
                "bg-slate-900/95",
                bgMap[toast.type]
              )}
            >
              <div className="mt-0.5 flex-shrink-0">{iconMap[toast.type]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{toast.title}</p>
                {toast.message && (
                  <p className="text-xs text-white/60 mt-0.5">{toast.message}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-white/30 hover:text-white/70 transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
