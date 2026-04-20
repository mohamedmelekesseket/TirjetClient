"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="cd-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="cd-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button type="button" className="cd-close" onClick={onClose} aria-label="Fermer">
          <X size={16} />
        </button>

        <div className="cd-title">{title}</div>
        {description ? <div className="cd-desc">{description}</div> : null}

        <div className="cd-actions">
          <button type="button" className="cd-btn cd-btn--ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`cd-btn cd-btn--primary${danger ? " cd-btn--danger" : ""}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "..." : confirmLabel}
          </button>
        </div>
      </div>

      <style jsx>{`
        .cd-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.42);
          display: grid;
          place-items: center;
          z-index: 1400;
          padding: 18px;
        }
        .cd-modal {
          width: min(460px, 100%);
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 18px 70px rgba(0, 0, 0, 0.22);
          border: 1px solid rgba(0, 0, 0, 0.08);
          padding: 18px 18px 14px;
          position: relative;
        }
        :global(.site-body) .cd-modal {
          font-family: var(--font-sans);
        }
        .cd-close {
          position: absolute;
          right: 10px;
          top: 10px;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: #fff;
          cursor: pointer;
          display: grid;
          place-items: center;
        }
        .cd-title {
          font-weight: 700;
          font-size: 15px;
          color: #16110c;
          padding-right: 44px;
        }
        .cd-desc {
          margin-top: 8px;
          font-size: 13px;
          line-height: 1.5;
          color: rgba(22, 17, 12, 0.7);
        }
        .cd-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 16px;
        }
        .cd-btn {
          height: 38px;
          padding: 0 14px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid transparent;
          cursor: pointer;
        }
        .cd-btn--ghost {
          background: #fff;
          border-color: rgba(0, 0, 0, 0.12);
          color: rgba(22, 17, 12, 0.75);
        }
        .cd-btn--primary {
          background: #e8724a;
          color: #fff;
          box-shadow: 0 10px 24px rgba(232, 114, 74, 0.25);
        }
        .cd-btn--danger {
          background: #e53935;
          box-shadow: 0 10px 24px rgba(229, 57, 53, 0.22);
        }
        .cd-btn:disabled,
        .cd-close:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

