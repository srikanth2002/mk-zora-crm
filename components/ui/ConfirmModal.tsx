"use client";

import Modal from "./Modal";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "success" | "primary";
  loading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  loading = false,
}: ConfirmModalProps) {
  const styles = {
    danger: {
      icon: "!",
      iconBg: "bg-red-50",
      iconText: "text-red-600",
      button: "bg-red-600 hover:bg-red-700",
    },
    warning: {
      icon: "!",
      iconBg: "bg-amber-50",
      iconText: "text-amber-600",
      button: "bg-amber-600 hover:bg-amber-700",
    },
    success: {
      icon: "✓",
      iconBg: "bg-emerald-50",
      iconText: "text-emerald-600",
      button: "bg-emerald-600 hover:bg-emerald-700",
    },
    primary: {
      icon: "?",
      iconBg: "bg-slate-100",
      iconText: "text-slate-700",
      button: "bg-slate-900 hover:bg-slate-800",
    },
  }[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
    >
      <div className="text-center">
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${styles.iconBg}`}
        >
          <span className={`text-xl font-bold ${styles.iconText}`}>
            {styles.icon}
          </span>
        </div>

        <p className="mt-5 text-sm leading-6 text-slate-600">
          {message}
        </p>

        <div className="mt-7 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${styles.button} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {loading ? "Please wait..." : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}