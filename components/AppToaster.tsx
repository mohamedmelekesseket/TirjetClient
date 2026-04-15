"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { APP_TOAST_EVENT, AppToastPayload, AppToastType } from "@/lib/toast";

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  type: AppToastType;
  durationMs: number;
}

const ICON_BY_TYPE = {
  success: CheckCircle2,
  error: TriangleAlert,
  info: Info,
} as const;

export default function AppToaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    const onToast = (event: Event) => {
      const custom = event as CustomEvent<AppToastPayload>;
      const detail = custom.detail;
      if (!detail?.title) return;

      const toast: ToastItem = {
        id: ++idRef.current,
        title: detail.title,
        description: detail.description,
        type: detail.type ?? "success",
        durationMs: detail.durationMs ?? 3200,
      };

      setToasts((prev) => [...prev.slice(-2), toast]);

      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== toast.id));
      }, toast.durationMs);
    };

    window.addEventListener(APP_TOAST_EVENT, onToast as EventListener);
    return () => window.removeEventListener(APP_TOAST_EVENT, onToast as EventListener);
  }, []);

  return (
    <div className="app-toaster" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => {
        const Icon = ICON_BY_TYPE[toast.type];
        return (
          <div key={toast.id} className={`app-toast app-toast--${toast.type}`} role="status">
            <span className="app-toast__icon" aria-hidden="true">
              <Icon size={18} />
            </span>
            <div className="app-toast__content">
              <strong>{toast.title}</strong>
              {toast.description ? <span>{toast.description}</span> : null}
            </div>
            <button
              type="button"
              className="app-toast__close"
              aria-label="Fermer"
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== toast.id))}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
